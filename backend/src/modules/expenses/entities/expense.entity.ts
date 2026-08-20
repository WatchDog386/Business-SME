import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export const EXPENSE_PAYMENT_METHODS = ['CASH', 'M-PESA', 'BANK', 'CARD'] as const;

@Entity('expenses')
@Index(['businessId', 'expense_date'])
@Index(['businessId', 'categoryId'])
export class Expense extends BaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'varchar', length: 150 })
  description: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'simple-enum', enum: EXPENSE_PAYMENT_METHODS, default: 'CASH' })
  payment_method: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receipt_url: string | null;

  @Column({ type: 'uuid', nullable: true })
  employeeId: string | null;

  @Column({ type: 'timestamptz' })
  expense_date: Date;
}