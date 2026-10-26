import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { BatchStatus } from '@pharmacy/shared';

@Entity('batches')
@Index(['productId', 'expiryDate'])
export class Batch {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: string;

  @Column({ name: 'batch_number', type: 'varchar', length: 50 })
  batchNumber: string;

  @Column({ name: 'manufacturing_date', type: 'date' })
  manufacturingDate: Date;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ name: 'quantity_remaining', type: 'int', default: 0 })
  quantityRemaining: number;

  @Column({ name: 'import_price', type: 'decimal', precision: 12, scale: 2 })
  importPrice: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: BatchStatus.ACTIVE,
  })
  status: BatchStatus;

  @ManyToOne(() => Product, (product) => product.batches)
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;
}
