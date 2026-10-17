import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * One paybill payment forwarded to the C2B webhook. The M-Pesa code
 * (TransID) is unique, so a payment that is sent twice is applied once.
 */
@Entity('mpesa_c2b_transactions')
@Index(['businessId', 'created_at'])
export class MpesaC2bTransaction extends BaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  /** M-Pesa confirmation code, e.g. RKTQDM7W6S. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  trans_id: string;

  @Column({ type: 'timestamptz', nullable: true })
  trans_time: Date | null;

  @Column({ type: 'int' })
  amount: number;

  /** What the client typed as the account number, e.g. FBI-0001. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  bill_ref: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  short_code: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  msisdn: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  payer_name: string | null;

  /** The subscriber the account number matched, if any. */
  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  /** APPLIED: on the subscriber's account. UNMATCHED: no subscriber has that account number. */
  @Column({ type: 'varchar', length: 12, default: 'PROCESSING' })
  status: 'PROCESSING' | 'APPLIED' | 'UNMATCHED';

  /** Sales the money went to (invoices settled, package renewed, credit). */
  @Column({ type: 'simple-json', nullable: true })
  sale_ids: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  raw: Record<string, unknown> | null;
}
