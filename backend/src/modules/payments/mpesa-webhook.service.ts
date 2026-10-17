import { BadRequestException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Business } from '../businesses/entities/business.entity';
import { Customer } from '../customers/entities/customer.entity';
import { SalesService } from '../sales/sales.service';
import { PaymentsService } from './payments.service';

/** One M-Pesa payment as the partner posts it: Daraja C2B confirmation field names. */
export interface MpesaWebhookPayment {
  TransID: string;
  TransAmount: number;
  TransTime: string | null;
  TransactionType: string | null;
  BusinessShortCode: string | null;
  BillRefNumber: string | null;
  MSISDN: string | null;
  name: string | null;
}

/**
 * Payments forwarded by the partner who owns the Daraja paybill: we never see
 * their keys, they POST each confirmed payment here. Each one is recorded once
 * (keyed on the M-Pesa receipt) as a paid M-Pesa sale, linked to the client
 * whose account number or phone matches. Set MPESA_WEBHOOK_SECRET and
 * MPESA_WEBHOOK_BUSINESS_ID.
 */
@Injectable()
export class MpesaWebhookService {
  private readonly logger = new Logger(MpesaWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly sales: SalesService,
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  private env(name: string): string {
    return (this.config.get<string>(name) ?? process.env[name] ?? '').trim();
  }

  /** Accepts the secret as X-Webhook-Secret, "Authorization: Bearer …" or ?token=. */
  authorise(presented: string | undefined) {
    const secret = this.env('MPESA_WEBHOOK_SECRET');
    if (!secret || !this.env('MPESA_WEBHOOK_BUSINESS_ID')) {
      throw new ServiceUnavailableException({ code: 'WEBHOOK_NOT_CONFIGURED', message: 'The M-Pesa webhook is not set up yet.' });
    }
    // Hash both sides so the comparison is constant-time whatever the lengths
    const digest = (v: string) => createHash('sha256').update(v).digest();
    if (!presented || !timingSafeEqual(digest(presented.trim()), digest(secret))) {
      throw new UnauthorizedException({ code: 'BAD_WEBHOOK_SECRET', message: 'Wrong or missing webhook secret.' });
    }
  }

  /** Reads Daraja C2B fields (any case); throws when TransID or TransAmount is missing. */
  static parse(body: unknown): MpesaWebhookPayment {
    const raw = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const fields = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
    const text = (...keys: string[]) => {
      for (const k of keys) {
        const v = fields.get(k.toLowerCase());
        if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
      }
      return null;
    };
    const transId = text('TransID', 'receipt', 'MpesaReceiptNumber');
    const amount = Number(text('TransAmount', 'amount'));
    if (!transId || !/^[A-Za-z0-9]{6,20}$/.test(transId)) {
      throw new BadRequestException({ code: 'INVALID_TRANS_ID', message: 'TransID (the M-Pesa receipt, e.g. SJK3ABC12D) is required.' });
    }
    if (!Number.isFinite(amount) || amount < 1) {
      throw new BadRequestException({ code: 'INVALID_AMOUNT', message: 'TransAmount must be at least 1.' });
    }
    const name = [text('FirstName'), text('MiddleName'), text('LastName')].filter(Boolean).join(' ');
    return {
      TransID: transId.toUpperCase(),
      TransAmount: amount,
      TransTime: text('TransTime'),
      TransactionType: text('TransactionType'),
      BusinessShortCode: text('BusinessShortCode'),
      BillRefNumber: text('BillRefNumber', 'account'),
      MSISDN: text('MSISDN', 'phone'),
      name: name || text('name'),
    };
  }

  async receive(body: unknown) {
    const payment = MpesaWebhookService.parse(body);
    const businessId = this.env('MPESA_WEBHOOK_BUSINESS_ID');
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business || !business.ownerId) {
      this.logger.error(`MPESA_WEBHOOK_BUSINESS_ID ${businessId} is not a business with an owner`);
      throw new ServiceUnavailableException({ code: 'WEBHOOK_NOT_CONFIGURED', message: 'The M-Pesa webhook is not set up yet.' });
    }

    const customer = await this.matchCustomer(businessId, payment);
    const paidAt = payment.TransTime
      ? DateTime.fromFormat(payment.TransTime, 'yyyyMMddHHmmss', { zone: 'Africa/Nairobi' })
      : null;
    const saleDate = paidAt?.isValid && paidAt <= DateTime.now() ? paidAt.setZone(business.timezone).toISODate() : undefined;
    const notes = [
      `M-Pesa ${payment.TransID}`,
      payment.name,
      payment.MSISDN,
      payment.BillRefNumber ? `account ${payment.BillRefNumber}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    // Same receipt posted again (partner retry) returns the sale already recorded
    const sale = await this.sales.create(
      businessId,
      {
        items: [],
        total: payment.TransAmount,
        saleType: 'GENERAL',
        paymentMethod: 'M-PESA',
        reference: payment.TransID,
        customerId: customer?.id,
        notes,
        idempotencyKey: `mpesa:${payment.TransID}`,
        saleDate: saleDate ?? undefined,
      },
      { userId: business.ownerId, role: 'OWNER' },
      business.timezone,
    );
    return {
      ResultCode: 0,
      ResultDesc: 'Accepted',
      TransID: payment.TransID,
      saleId: sale.id,
      matchedClient: customer ? customer.name : null,
    };
  }

  /** Client whose account number equals the account typed on M-Pesa, else whose phone matches. */
  private async matchCustomer(businessId: string, payment: MpesaWebhookPayment): Promise<Customer | null> {
    const account = payment.BillRefNumber?.replace(/\s/g, '');
    if (account) {
      const byAccount = await this.customerRepo
        .createQueryBuilder('c')
        .where('c.businessId = :businessId', { businessId })
        .andWhere('(UPPER(c.account_number) = :account OR UPPER(c.username) = :account)', { account: account.toUpperCase() })
        .getOne();
      if (byAccount) return byAccount;
    }
    // Account typed as a phone number, or the payer's own number (Safaricom may mask it)
    for (const candidate of [account, payment.MSISDN]) {
      const phone = candidate ? PaymentsService.normalisePhone(candidate) : null;
      if (!phone) continue;
      const local = phone.slice(3);
      const byPhone = await this.customerRepo
        .createQueryBuilder('c')
        .where('c.businessId = :businessId', { businessId })
        .andWhere("REPLACE(c.phone, ' ', '') LIKE :tail", { tail: `%${local}` })
        .getMany();
      const exact = byPhone.find((c) => c.phone && PaymentsService.normalisePhone(c.phone) === phone);
      if (exact) return exact;
    }
    return null;
  }
}
