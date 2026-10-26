import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Relation,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductUnit } from './product-unit.entity';
import { Batch } from '../../inventory/entities/batch.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'usage_instructions', type: 'text', nullable: true })
  usageInstructions?: string;

  @Column({
    name: 'default_storage',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  defaultStorage?: string;

  @Column({ name: 'safety_stock_threshold', type: 'int', default: 20 })
  safetyStockThreshold: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;

  @OneToMany(() => ProductUnit, (unit) => unit.product, { cascade: true })
  units: Relation<ProductUnit>[];

  @OneToMany(() => Batch, (batch) => batch.product)
  batches: Relation<Batch>[];
}
