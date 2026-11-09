import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrderStatus } from '@pharmacy/shared';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'po_code', unique: true })
  poCode: string;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier;

  @Column({ name: 'creator_id', nullable: true })
  creatorId: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.COMPLETED,
  })
  status: PurchaseOrderStatus;

  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalCost: number;

  @Column({ name: 'invoice_number', nullable: true })
  invoiceNumber: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'delivery_date', type: 'timestamp', nullable: true })
  deliveryDate: Date;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder)
  items: PurchaseOrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
