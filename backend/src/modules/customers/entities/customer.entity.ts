import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('customers')
@Index(['businessId'])
@Index(['businessId', 'phone'])
export class Customer extends BaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', default: 0 })
  total_spent: number;

  @Column({ type: 'int', default: 0 })
  outstanding_balance: number;

  @Column({ type: 'int', default: 0 })
  visit_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_visit_at: Date | null;
}