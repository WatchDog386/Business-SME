import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { timingSafeEqual } from 'node:crypto';
import { DateTime } from 'luxon';
import { MpesaC2bTransaction } from './entities/mpesa-c2b-transaction.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';
import { SalesService } from '../sales/sales.service';
import { UserRole } from '../../common/types/auth-user.interface';
import { roundKES } from '../../common/utils/money';
import { normaliseAccountNumber } from '../customers/customers.service';

/** The fields Safaricom posts to a C2B confirmation URL; the forwarder sends the same. */
export interface C2bPayload {
  TransactionType?: string;
  TransID?: string;
  TransTime?: string;
  TransAmount?: string | number;
  BusinessShortCode?: string;
  BillRefNumber?: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

const ACCEPTED = { ResultCode: 0, ResultDesc: 'Accepted' };

/**
 * Paybill payments forwarded from the company's existing M-Pesa (Daraja)
 * setup. Each one is matched to a subscriber by the account number they typed
 * (FBI0001…) and applied: unpaid invoices first (oldest first), then a
 * package renewal if what is left covers it, and anything over is kept as
 * credit on their account. Payments with an unknown account number are still
 * counted as revenue and flagged for the office.
 */
@Injectable()
export class C2bService {
  private readonly logger = new Logger(C2bService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly sales: SalesService,
    @InjectRepository(MpesaC2bTransaction) private readonly txRepo: Repository<MpesaC2bTransaction>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Subscription) private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember) private readonly memberRepo: Repository<BusinessMember>,
  ) {}

  private env(name: string): string {
    return (this.config.get<string>(name) ?? process.env[name] ?? '').trim();
  }

  /** The shared secret must match MPESA_WEBHOOK_SECRET (header or ?secret=). */
  assertSecret(given: string | undefined) {
    const expected = this.env('MPESA_WEBHOOK_SECRET');
    if (!expected) {
      throw new ServiceUnavailableException({ code: 'WEBHOOK_NOT_CONFIGURED', message: 'The M-Pesa webhook is not set up yet.' });
    }
    const a = Buffer.from(given ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException({ code: 'BAD_WEBHOOK_SECRET', message: 'Wrong webhook secret.' });
    }
  }

  /** FBI0001, fbi1, "FBI 0001" and FBI-0001 all mean FBI0001. */
  static normaliseAccount(ref: string): string {
    return normaliseAccountNumber(ref);
  }

  /** "20261017143005" (Nairobi time) → Date. */
  private transTime(value: string | undefined, timezone: string): Date | null {
    if (!value) return null;
    const t = DateTime.fromFormat(String(value), 'yyyyLLddHHmmss', { zone: timezone });
    return t.isValid ? t.toJSDate() : null;
  }

  private async targetBusiness(): Promise<Business | null> {
    const id = this.env('MPESA_C2B_BUSINESS_ID');
    if (id) return this.businessRepo.findOne({ where: { id } });
    // One company on this server: the first business created
    return this.businessRepo.findOne({ where: {}, order: { created_at: 'ASC' } });
  }

  private async matchCustomer(businessId: string, ref: string): Promise<Customer | null> {
    if (!ref.trim()) return null;
    const account = C2bService.normaliseAccount(ref);
    return (
      (await this.customerRepo
        .createQueryBuilder('c')
        .where('c.businessId = :businessId', { businessId })
        // Hyphens and spaces in a saved account number don't matter
        .andWhere(`(REGEXP_REPLACE(UPPER(c.account_number), '[^A-Z0-9]', '', 'g') = :account OR UPPER(c.username) = :raw)`, {
          account: account.replace(/[^A-Z0-9]/g, ''),
          raw: ref.trim().toUpperCase(),
        })
        .orderBy('c.created_at', 'ASC')
        .getOne()) ?? null
    );
  }

  async receive(payload: C2bPayload) {
    const transId = String(payload.TransID ?? '').trim().toUpperCase();
    const amount = roundKES(Number(payload.TransAmount));
    if (!transId || !Number.isFinite(amount) || amount <= 0) {
      return { ResultCode: 1, ResultDesc: 'Rejected: TransID and a positive TransAmount are required' };
    }
    // Sent before: already applied, just confirm
    if (await this.txRepo.findOne({ where: { trans_id: transId } })) return ACCEPTED;

    const business = await this.targetBusiness();
    if (!business) return { ResultCode: 1, ResultDesc: 'Rejected: no business on this server' };
    const owner = await this.memberRepo.findOne({ where: { businessId: business.id, role: UserRole.OWNER } });
    const actor = { userId: owner?.userId ?? '', role: UserRole.OWNER as string };

    const ref = String(payload.BillRefNumber ?? '').trim();
    const name = [payload.FirstName, payload.MiddleName, payload.LastName].filter(Boolean).join(' ').trim();
    const customer = await this.matchCustomer(business.id, ref);

    const tx = await this.txRepo.save(
      this.txRepo.create({
        businessId: business.id,
        trans_id: transId,
        trans_time: this.transTime(payload.TransTime, business.timezone),
        amount,
        bill_ref: ref || null,
        short_code: payload.BusinessShortCode ? String(payload.BusinessShortCode) : null,
        msisdn: payload.MSISDN ? String(payload.MSISDN) : null,
        payer_name: name || null,
        customerId: customer?.id ?? null,
        status: 'PROCESSING',
        raw: payload as Record<string, unknown>,
      }),
    );

    try {
      const saleIds = customer
        ? await this.applyToCustomer(business, customer, amount, transId, actor)
        : await this.recordUnmatched(business, amount, transId, ref, name, payload.MSISDN, actor);
      tx.status = customer ? 'APPLIED' : 'UNMATCHED';
      tx.sale_ids = saleIds;
      await this.txRepo.save(tx);
      this.logger.log(`M-Pesa ${transId}: KES ${amount} for "${ref}" ${customer ? `→ ${customer.name}` : '(no matching account)'}`);
      return ACCEPTED;
    } catch (err) {
      // Not applied: drop the record so a resend is processed again (each step is idempotent)
      await this.txRepo.delete({ id: tx.id });
      this.logger.error(`M-Pesa ${transId} could not be applied`, err instanceof Error ? err.stack : String(err));
      throw err;
    }
  }

  private async applyToCustomer(
    business: Business,
    customer: Customer,
    amount: number,
    transId: string,
    actor: { userId: string; role: string },
  ): Promise<string[]> {
    let left = amount;
    const saleIds: string[] = [];

    // 1. Unpaid and part-paid invoices, oldest first
    const open = await this.saleRepo.find({
      where: {
        businessId: business.id,
        customerId: customer.id,
        payment_status: In(['UNPAID', 'PARTIAL']),
        sale_type: Not('ADVANCE'),
      },
      order: { created_at: 'ASC' },
    });
    for (const sale of open) {
      if (left <= 0) break;
      const detail = await this.sales.get(business.id, sale.id);
      const paid = (detail.payments ?? [])
        .filter((p) => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);
      const due = sale.total - paid - (sale.advance_credit ?? 0);
      if (due <= 0) continue;
      const pay = Math.min(due, left);
      await this.sales.recordPayment(business.id, sale.id, { amount: pay, method: 'M-PESA', reference: transId }, actor);
      saleIds.push(sale.id);
      left -= pay;
    }

    // 2. What is left renews their package when it covers the price
    if (left > 0) {
      const sub = await this.subRepo.findOne({ where: { businessId: business.id, customerId: customer.id } });
      const pkg = sub ? await this.productRepo.findOne({ where: { businessId: business.id, id: sub.productId, active: true } }) : null;
      const price = pkg ? Math.max(0, pkg.selling_price - (customer.discount ?? 0)) : 0;
      if (pkg?.billing_days && price > 0 && left >= price) {
        const sale = await this.sales.create(
          business.id,
          {
            items: [{ productId: pkg.id, quantity: 1 }],
            saleType: 'PACKAGE',
            customerId: customer.id,
            discount: Math.min(customer.discount ?? 0, pkg.selling_price),
            paymentMethod: 'M-PESA',
            amountPaid: price,
            reference: transId,
            notes: `M-Pesa paybill ${transId}`,
            idempotencyKey: `mpesa-${transId}-package`,
          },
          actor,
          business.timezone,
        );
        saleIds.push(sale.id);
        left -= price;
      }
    }

    // 3. Anything over stays on their account as credit for next time
    if (left > 0) {
      const sale = await this.sales.create(
        business.id,
        {
          items: [],
          total: left,
          saleType: 'ADVANCE',
          customerId: customer.id,
          paymentMethod: 'M-PESA',
          amountPaid: left,
          reference: transId,
          notes: `M-Pesa paybill ${transId}: credit on account`,
          idempotencyKey: `mpesa-${transId}-credit`,
        },
        actor,
        business.timezone,
      );
      saleIds.push(sale.id);
    }
    return saleIds;
  }

  /** No subscriber has that account number: count the money, flag it for the office. */
  private async recordUnmatched(
    business: Business,
    amount: number,
    transId: string,
    ref: string,
    name: string,
    msisdn: string | undefined,
    actor: { userId: string; role: string },
  ): Promise<string[]> {
    const sale = await this.sales.create(
      business.id,
      {
        items: [],
        total: amount,
        saleType: 'GENERAL',
        paymentMethod: 'M-PESA',
        amountPaid: amount,
        reference: transId,
        notes: `M-Pesa paybill ${transId} from ${name || 'unknown'}${msisdn ? ` (${msisdn})` : ''}: account "${ref || 'blank'}" not matched to a subscriber`,
        idempotencyKey: `mpesa-${transId}-unmatched`,
      },
      actor,
      business.timezone,
    );
    return [sale.id];
  }

  /** Latest paybill payments, for the office. */
  list(businessId: string, limit = 100) {
    return this.txRepo.find({
      where: { businessId },
      order: { created_at: 'DESC' },
      take: Math.min(500, Math.max(1, limit)),
      select: ['id', 'trans_id', 'trans_time', 'amount', 'bill_ref', 'msisdn', 'payer_name', 'customerId', 'status', 'sale_ids', 'created_at'],
    });
  }
}
