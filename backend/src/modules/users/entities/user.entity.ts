import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 120 })
  full_name: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  reset_token_hash: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  reset_token_expires_at: Date | null;
}