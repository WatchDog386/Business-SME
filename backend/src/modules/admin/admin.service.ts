import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPayment } from '../billing/entities/subscription-payment.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Service } from '../products/entities/service.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SubscriptionPayment)
    private readonly paymentRepo: Repository<SubscriptionPayment>,
    @InjectRepository(Business)
    private readonly bizRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    private readonly config: ConfigService,
  ) {}

  async summary() {
    const [totalBusinesses, paidPayments, monthPaid] = await Promise.all([
      this.bizRepo.count(),
      this.paymentRepo.find({ where: { status: 'PAID' } }),
      this.paymentRepo
        .createQueryBuilder('p')
        .where('p.status = :status', { status: 'PAID' })
        .andWhere('p.paid_at >= date_trunc(\'month\', now())')
        .getMany(),
    ]);

    const lifetimeRevenue = paidPayments.reduce((s, p) => s + p.amount, 0);
    const monthRevenue = monthPaid.reduce((s, p) => s + p.amount, 0);
    const pending = await this.paymentRepo.count({
      where: { status: 'PENDING' },
    });

    return {
      totalBusinesses,
      activeSubscriptions: await this.bizRepo.count({
        where: [{ subscription_plan: 'GROWTH' }, { subscription_plan: 'SCALE' }],
      }),
      monthRevenue,
      lifetimeRevenue,
      pendingPayments: pending,
    };
  }

  async listBusinesses() {
    return this.bizRepo
      .createQueryBuilder('b')
      .leftJoin('users', 'u', 'u.id = b."ownerId"')
      .addSelect('u.email', 'owner_email')
      .addSelect('u.full_name', 'owner_name')
      .addSelect(
        '(SELECT COUNT(*) FROM business_members bm WHERE bm."businessId" = b.id AND bm.status = \'ACTIVE\')',
        'member_count',
      )
      .orderBy('b.created_at', 'DESC')
      .getRawAndEntities()
      .then((res) =>
        res.entities.map((b, idx) => ({
          ...b,
          owner_email:
            (res.raw[idx] as { owner_email?: string }).owner_email ?? null,
          owner_name:
            (res.raw[idx] as { owner_name?: string }).owner_name ?? null,
          member_count: Number(
            (res.raw[idx] as { member_count?: string }).member_count ?? 0,
          ),
        })),
      );
  }

  async setPlan(businessId: string, plan: string) {
    const business = await this.bizRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found.',
      });
    }
    business.subscription_plan = plan;
    await this.bizRepo.save(business);
    return business;
  }

  listPayments(status?: string) {
    return this.paymentRepo.find({
      where: status ? { status: status as never } : undefined,
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async confirmPayment(id: string) {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'Payment not found.',
      });
    }
    payment.status = 'PAID';
    payment.paid_at = new Date();
    await this.paymentRepo.save(payment);
    await this.bizRepo.update(payment.businessId, {
      subscription_plan: payment.plan,
    });
    return payment;
  }

  /** Every account registered on the platform, with how many businesses they run. */
  async listUsers() {
    const result = await this.userRepo
      .createQueryBuilder('u')
      .addSelect(
        '(SELECT COUNT(*) FROM business_members bm WHERE bm."userId" = u.id AND bm.status = \'ACTIVE\')',
        'business_count',
      )
      .orderBy('u.created_at', 'DESC')
      .getRawAndEntities();

    return result.entities.map((u, idx) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      emailVerified: u.email_verified,
      createdAt: u.created_at,
      isAdmin: (this.config.get<string[]>('adminEmails') ?? []).includes(
        u.email.toLowerCase(),
      ),
      businessCount: Number(
        (result.raw[idx] as { business_count?: string }).business_count ?? 0,
      ),
    }));
  }

  async getBusinessDetail(businessId: string) {
    const business = await this.bizRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found.',
      });
    }
    const owner = business.ownerId
      ? await this.userRepo.findOne({ where: { id: business.ownerId } })
      : null;

    const members = await this.memberRepo.find({ where: { businessId } });
    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        const u = await this.userRepo.findOne({ where: { id: m.userId } });
        return {
          id: m.id,
          userId: m.userId,
          role: m.role,
          status: m.status,
          created_at: m.created_at,
          user: u
            ? {
                id: u.id,
                email: u.email,
                fullName: u.full_name,
                phone: u.phone,
                avatar_url: u.avatar_url,
              }
            : null,
        };
      }),
    );

    const [
      productCount,
      serviceCount,
      customerCount,
      saleCount,
      expenseCount,
      revenueRow,
      expenseRow,
      recentSales,
      recentCustomers,
      subscriptionHistory,
    ] = await Promise.all([
      this.productRepo.count({ where: { businessId } }),
      this.serviceRepo.count({ where: { businessId } }),
      this.customerRepo.count({ where: { businessId } }),
      this.saleRepo.count({ where: { businessId } }),
      this.expenseRepo.count({ where: { businessId } }),
      this.saleRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.total),0)', 'total')
        .where('s."businessId" = :businessId', { businessId })
        .andWhere("s.payment_status != 'CANCELLED'")
        .getRawOne<{ total: string }>(),
      this.expenseRepo
        .createQueryBuilder('e')
        .select('COALESCE(SUM(e.amount),0)', 'total')
        .where('e."businessId" = :businessId', { businessId })
        .getRawOne<{ total: string }>(),
      this.saleRepo.find({
        where: { businessId },
        order: { created_at: 'DESC' },
        take: 5,
      }),
      this.customerRepo.find({
        where: { businessId },
        order: { created_at: 'DESC' },
        take: 5,
      }),
      this.paymentRepo.find({
        where: { businessId },
        order: { created_at: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      business: {
        ...business,
        owner_email: owner?.email ?? null,
        owner_name: owner?.full_name ?? null,
      },
      owner: owner
        ? {
            id: owner.id,
            email: owner.email,
            fullName: owner.full_name,
            phone: owner.phone,
            avatar_url: owner.avatar_url,
            emailVerified: owner.email_verified,
          }
        : null,
      members: enrichedMembers,
      stats: {
        products: productCount,
        services: serviceCount,
        customers: customerCount,
        sales: saleCount,
        expenses: expenseCount,
        totalRevenue: Number(revenueRow?.total ?? 0),
        totalExpenses: Number(expenseRow?.total ?? 0),
      },
      recentSales,
      recentCustomers,
      subscriptionHistory,
    };
  }

  settings() {
    return {
      adminEmails: this.config.get<string[]>('adminEmails') ?? [],
      paystackConfigured: Boolean(this.config.get<string>('paystackSecretKey')),
      plans: [
        { id: 'STARTER', price: 0 },
        { id: 'GROWTH', price: 999 },
        { id: 'SCALE', price: 2499 },
      ],
      currency: 'KES',
      billingCycle: 'monthly',
    };
  }
}
