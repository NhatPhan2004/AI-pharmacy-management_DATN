import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { PurchaseOrderStatus } from '@pharmacy/shared';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'po_code', type: 'varchar', length: 50, unique: true })
  poCode: string;

  @Column({ name: 'supplier_id', type: 'bigint' })
  supplierId: string;

  @Column({ name: 'creator_id', type: 'bigint' })
  creatorId: string;

  @Column({ name: 'reorder_plan_id', type: 'bigint', nullable: true })
  reorderPlanId?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalCost: number;

  @Column({
    name: 'delivery_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deliveryDate?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(
    (): typeof PurchaseOrderItem => PurchaseOrderItem,
    (item: PurchaseOrderItem): Relation<PurchaseOrder> => item.purchaseOrder,
    {
      cascade: true,
    },
  )
  items: Relation<PurchaseOrderItem>[];
}
