import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('products')
@Index(['businessId'])
@Unique(['businessId', 'sku'])
export class Product extends BaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'int' })
  cost_price: number;

  @Column({ type: 'int' })
  selling_price: number;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @Column({ type: 'int', default: 5 })
  low_stock_threshold: number;

  @Column({ type: 'boolean', default: true })
  track_inventory: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}