import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentsService } from '../payments/payments.service';
import { SalesService } from '../sales/sales.service';
import { DocumentsService, DocKind } from '../documents/documents.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '../../common/types/auth-user.interface';

/** What a client paid for with an M-Pesa prompt, so the sale is recorded once it's paid. */
interface PendingPay {
  businessId: string;
  customerId: string;
  userId: string;
  productId: string;
  recordedSaleId: string | null;
}

/**
 * The client app: a WiFi client signs in and sees only their own package,
 * balance, payments and receipts, and can pay or renew with M-Pesa. Staff
 * create the client's login from the client's page.
 */
@Injectable()
export class ClientPortalService {
  private readonly pending = new Map<string, PendingPay>();

  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember) private readonly memberRepo: Repository<BusinessMember>,
    private readonly subscriptions: SubscriptionsService,
    private readonly payments: PaymentsService,
    private readonly sales: SalesService,
    private readonly documents: DocumentsService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  private async customer(businessId: string, customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { businessId, id: customerId } });
    if (!customer) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'Your client record was not found.' });
    return customer;
  }

  /* ---------------- The client's own view ---------------- */

  async me(businessId: string, customerId: string) {
    const [customer, business, subscription, packages, sales] = await Promise.all([
      this.customer(businessId, customerId),
      this.businessRepo.findOne({ where: { id: businessId } }),
      this.subscriptions.forCustomer(businessId, customerId),
      this.productRepo.find({
        where: { businessId, active: true, billing_days: Not(IsNull()) },
        order: { selling_price: 'ASC' },
      }),
      this.saleRepo.find({
        where: { businessId, customerId },
        order: { created_at: 'DESC' },
        take: 20,
      }),
    ]);
    return {
      business: { name: business?.name ?? 'Optimas', phone: business?.phone ?? null, email: business?.email ?? null },
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        balance: customer.outstanding_balance,
        totalSpent: customer.total_spent,
      },
      subscription,
      packages: packages.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.selling_price,
        speedMbps: p.speed_mbps,
        billingDays: p.billing_days,
        description: p.description ?? null,
      })),
      payments: sales
        .filter((s) => s.payment_status !== 'CANCELLED')
        .map((s) => ({ id: s.id, number: s.number, total: s.total, status: s.payment_status, method: s.payment_method, at: s.created_at })),
    };
  }

  /** M-Pesa prompt to the client's phone for their package (or one they switch to). */
  async pay(businessId: string, customerId: string, userId: string, input: { productId?: string; phone?: string }) {
    const customer = await this.customer(businessId, customerId);
    const current = await this.subscriptions.forCustomer(businessId, customerId);
    const productId = input.productId ?? current?.productId;
    if (!productId) throw new BadRequestException({ code: 'CHOOSE_PACKAGE', message: 'Choose a WiFi package to pay for.' });
    const pkg = await this.productRepo.findOne({ where: { businessId, id: productId, active: true } });
    if (!pkg || !pkg.billing_days) throw new BadRequestException({ code: 'NOT_A_PACKAGE', message: 'Choose a WiFi package.' });
    const phone = input.phone?.trim() || customer.phone;
    if (!phone) throw new BadRequestException({ code: 'PHONE_REQUIRED', message: 'Enter your M-Pesa number.' });

    const push = await this.payments.stkPush(businessId, {
      phone,
      amount: pkg.selling_price,
      reference: pkg.name.split(/\s+/)[0],
      description: 'WiFi package',
    });
    this.pending.set(push.checkoutRequestId, { businessId, customerId, userId, productId: pkg.id, recordedSaleId: null });
    return push;
  }

  /** Checks the prompt; once paid, records the package sale (renews the subscription) exactly once. */
  async payStatus(businessId: string, customerId: string, checkoutRequestId: string) {
    const entry = this.pending.get(checkoutRequestId);
    if (!entry || entry.businessId !== businessId || entry.customerId !== customerId) {
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'That payment was not found.' });
    }
    const status = await this.payments.stkStatus(businessId, checkoutRequestId);
    if (status.state === 'paid' && !entry.recordedSaleId) {
      const sale = await this.sales.create(
        businessId,
        {
          items: [{ productId: entry.productId, quantity: 1 }],
          customerId,
          paymentMethod: 'M-PESA',
          amountPaid: status.amount,
          reference: status.receipt ?? undefined,
          notes: `Paid by the client in the app${status.receipt ? ` · M-Pesa ${status.receipt}` : ''}`,
          // The checkout id makes the sale idempotent: never recorded twice
          idempotencyKey: `stk-${checkoutRequestId}`,
        } as Parameters<SalesService['create']>[1],
        { userId: entry.userId, role: UserRole.CLIENT },
      );
      entry.recordedSaleId = sale.id;
    }
    return { ...status, saleId: entry.recordedSaleId };
  }

  async document(businessId: string, customerId: string, saleId: string, kind: DocKind) {
    const sale = await this.saleRepo.findOne({ where: { businessId, id: saleId } });
    if (!sale || sale.customerId !== customerId) {
      throw new ForbiddenException({ code: 'NOT_YOURS', message: 'That document is not yours.' });
    }
    return this.documents.render(businessId, saleId, kind);
  }

  /* ---------------- Staff: the client's app login ---------------- */

  async getAccess(businessId: string, customerId: string) {
    await this.customer(businessId, customerId);
    const member = await this.memberRepo.findOne({
      where: { businessId, customerId, role: UserRole.CLIENT },
      relations: { user: true },
    });
    return member
      ? { enabled: member.status === 'ACTIVE', email: member.user.email, createdAt: member.created_at }
      : { enabled: false, email: null, createdAt: null };
  }

  async grantAccess(
    businessId: string,
    customerId: string,
    input: { email: string; password: string },
    actorId: string,
  ) {
    const customer = await this.customer(businessId, customerId);
    const email = input.email.trim().toLowerCase();

    let user = await this.users.findByEmail(email);
    if (user) {
      const other = await this.memberRepo.findOne({ where: { businessId, userId: user.id } });
      if (other && !(other.role === UserRole.CLIENT && other.customerId === customerId)) {
        throw new ConflictException({
          code: 'EMAIL_IN_USE',
          message:
            other.role === UserRole.CLIENT
              ? 'That email already signs in another client.'
              : 'That email belongs to a staff member. Use a different email for the client.',
        });
      }
      // Existing login for this client: set the new password
      await this.users.update(user.id, { password_hash: await bcrypt.hash(input.password, 10) });
    } else {
      user = await this.users.create({
        email,
        fullName: customer.name,
        phone: customer.phone,
        passwordHash: await bcrypt.hash(input.password, 10),
      });
    }

    // One login per client: replace any older one
    const previous = await this.memberRepo.findOne({ where: { businessId, customerId, role: UserRole.CLIENT } });
    if (previous && previous.userId !== user.id) await this.memberRepo.remove(previous);

    const existing = await this.memberRepo.findOne({ where: { businessId, userId: user.id } });
    if (existing) {
      existing.status = 'ACTIVE';
      await this.memberRepo.save(existing);
    } else {
      await this.memberRepo.save(
        this.memberRepo.create({ businessId, userId: user.id, role: UserRole.CLIENT, customerId, status: 'ACTIVE' }),
      );
    }
    if (!customer.email) await this.customerRepo.update(customer.id, { email });

    await this.audit.log({
      businessId,
      userId: actorId,
      action: 'CLIENT_ACCESS_GRANTED',
      entity: 'customer',
      entityId: customerId,
      metadata: { email },
    });
    return this.getAccess(businessId, customerId);
  }

  async revokeAccess(businessId: string, customerId: string, actorId: string) {
    const member = await this.memberRepo.findOne({ where: { businessId, customerId, role: UserRole.CLIENT } });
    if (member) {
      member.status = 'DEACTIVATED';
      await this.memberRepo.save(member);
      await this.audit.log({
        businessId,
        userId: actorId,
        action: 'CLIENT_ACCESS_REVOKED',
        entity: 'customer',
        entityId: customerId,
        metadata: {},
      });
    }
    return this.getAccess(businessId, customerId);
  }
}
