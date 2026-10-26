import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'purchase_order_id', type: 'bigint' })
  purchaseOrderId: string;

  @Column({ name: 'unit_id', type: 'bigint' })
  unitId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'import_price', type: 'decimal', precision: 12, scale: 2 })
  importPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @ManyToOne(
    (): typeof PurchaseOrder => PurchaseOrder,
    (po: PurchaseOrder): Relation<PurchaseOrderItem>[] => po.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: Relation<PurchaseOrder>;
}
