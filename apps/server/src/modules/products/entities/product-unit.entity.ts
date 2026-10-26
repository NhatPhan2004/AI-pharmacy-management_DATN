import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_units')
export class ProductUnit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: string;

  @Column({ name: 'unit_name', type: 'varchar', length: 50 })
  unitName: string;

  @Column({ name: 'conversion_to_base', type: 'int', default: 1 })
  conversionToBase: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 12, scale: 2 })
  sellingPrice: number;

  @Column({ name: 'is_base_unit', type: 'boolean', default: false })
  isBaseUnit: boolean;

  @ManyToOne(() => Product, (product) => product.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;
}
