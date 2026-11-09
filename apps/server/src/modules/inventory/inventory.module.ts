import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Batch } from './entities/batch.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { ProductUnit } from '../products/entities/product-unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Batch,
      PurchaseOrder,
      PurchaseOrderItem,
      InventoryTransaction,
      ProductUnit,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
