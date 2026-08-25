import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';

export const PLAN_PRICES: Record<string, number> = {
  STARTER: 0,
  GROWTH: 999,
  SCALE: 2499,
};

export type BillingMethod = 'MPESA' | 'CARD' | 'BANK' | 'PAYPAL';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(SubscriptionPayment)
    private readonly paymentRepo: Repository<SubscriptionPayment>,
    @InjectRepository(Business)
    private readonly bizRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
  ) {}

  /**
   * Creates a PENDING subscription charge for the active business.
   * M-Pesa / Card / Bank are collected through Paystack (all three settle
   * into the platform owner's Paystack balance). PayPal is recorded as a
   * pending invoice that the owner confirms from the admin dashboard.
   */
  async initiate(
    userId: string,
    email: string,
    businessId: string,
    plan: string,
    method: BillingMethod,
  ) {
    const amount = PLAN_PRICES[plan.toUpperCase()];
    if (amount === undefined) {
      throw new BadRequestException({
        code: 'UNKNOWN_PLAN',
        message: 'Choose a valid subscription plan.',
      });
    }
    if (amount === 0) {
      throw new BadRequestException({
        code: 'FREE_PLAN',
        message: 'The Starter plan is free — no payment needed.',
      });
    }

    const membership = await this.memberRepo.findOne({
      where: { businessId, userId, status: 'ACTIVE' },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: 'NOT_A_MEMBER',
        message: 'You do not have access to this business.',
      });
    }

    const reference = `SUB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        businessId,
        plan: plan.toUpperCase(),
        amount,
        method,
        reference,
        payer_email: email,
        status: 'PENDING',
      }),
    );

    return {
      reference: payment.reference,
      amount: payment.amount,
      plan: payment.plan,
      method: payment.method,
      // PayPal has no self-serve gateway here yet — owner sends/confirms an invoice.
      requiresManualConfirmation: method === 'PAYPAL',
    };
  }

  /** Confirms a pending payment and upgrades the business plan. */
  async confirmByReference(reference: string): Promise<SubscriptionPayment> {
    const payment = await this.paymentRepo.findOne({ where: { reference } });
    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'That payment reference does not exist.',
      });
    }
    if (payment.status === 'PAID') return payment;

    payment.status = 'PAID';
    payment.paid_at = new Date();
    await this.paymentRepo.save(payment);

    await this.bizRepo.update(payment.businessId, {
      subscription_plan: payment.plan,
    });
    return payment;
  }

  /** Called by the frontend right after the gateway popup succeeds. */
  async verify(userId: string, reference: string) {
    const payment = await this.paymentRepo.findOne({ where: { reference } });
    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'That payment reference does not exist.',
      });
    }
    const membership = await this.memberRepo.findOne({
      where: { businessId: payment.businessId, userId, status: 'ACTIVE' },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: 'NOT_A_MEMBER',
        message: 'You do not have access to this payment.',
      });
    }
    return this.confirmByReference(reference);
  }
}
