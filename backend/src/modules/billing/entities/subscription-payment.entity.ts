import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type SubscriptionMethod = 'MPESA' | 'CARD' | 'BANK' | 'PAYPAL';
export type SubscriptionPaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

@Entity('subscription_payments')
@Index(['businessId'])
@Index(['reference'], { unique: true })
export class SubscriptionPayment extends BaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 20 })
  plan: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  method: SubscriptionMethod;

  @Column({ type: 'varchar', length: 80, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  payer_email: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: SubscriptionPaymentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
