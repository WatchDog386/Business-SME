import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export const PAYMENT_METHODS = ['M-PESA', 'CASH', 'BANK', 'CARD', 'CREDIT'] as const;
export const PAYMENT_STATUSES = [
  'PAID',
  'PARTIAL',
  'UNPAID',
  'REFUNDED',
  'CANCELLED',
] as const;

@Entity('sales')
@Index(['businessId', 'created_at'])
@Index(['businessId', 'customerId'])
@Unique(['businessId', 'idempotency_key'])
export class Sale extends BaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'uuid', nullable: true })
  employeeId: string | null;

  @Column({ type: 'int', default: 0 })
  subtotal: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({ type: 'int', default: 0 })
  tax: number;

  @Column({ type: 'int' })
  total: number;

  @Column({ type: 'simple-enum', enum: PAYMENT_STATUSES, default: 'PAID' })
  payment_status: string;

  @Column({ type: 'simple-enum', enum: PAYMENT_METHODS })
  payment_method: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 64 })
  idempotency_key: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by: string | null;

  /** Sequential per business; printed as the invoice number (INV-000123). */
  @Column({ type: 'int', nullable: true })
  number: number | null;
}