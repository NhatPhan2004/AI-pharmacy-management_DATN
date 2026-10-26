import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { InventoryTransactionType } from '@pharmacy/shared';

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'batch_id', type: 'bigint' })
  batchId: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'transaction_type', type: 'varchar', length: 20 })
  transactionType: InventoryTransactionType;

  @Column({ name: 'quantity_change', type: 'int' })
  quantityChange: number;

  @Column({ name: 'remaining_quantity', type: 'int' })
  remainingQuantity: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 20 })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'bigint' })
  referenceId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
