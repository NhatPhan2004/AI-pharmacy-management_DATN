// apps/server/src/modules/inventory/inventory.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CreatePurchaseOrderInput,
  BatchStatus,
  InventoryTransactionType,
  PurchaseOrderStatus,
} from '@pharmacy/shared';
import { Batch } from './entities/batch.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { ProductUnit } from '../products/entities/product-unit.entity';

export interface LowStockAlertItem {
  productId: string;
  productName: string;
  threshold: number;
  totalStock: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly dataSource: DataSource) {}

  async importPurchaseOrder(
    userId: string,
    input: CreatePurchaseOrderInput,
  ): Promise<{ success: boolean; purchaseOrderId: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalCost = 0;

      // Purchase Order
      const po = queryRunner.manager.create(PurchaseOrder, {
        supplierId: input.supplierId,
        creatorId: userId,
        status: PurchaseOrderStatus.COMPLETED,
        poCode: `PO-${Date.now()}`,
        deliveryDate: new Date(),
      });
      const savedPo = await queryRunner.manager.save(PurchaseOrder, po);

      for (const item of input.items) {
        const unit = await queryRunner.manager.findOne(ProductUnit, {
          where: { id: item.unitId, productId: item.productId },
        });

        if (!unit) {
          throw new BadRequestException(
            `Đơn vị tính không hợp lệ cho mã thuốc ID: ${item.productId}`,
          );
        }

        const subtotal = item.quantity * item.importPrice;
        totalCost += subtotal;

        const poItem = queryRunner.manager.create(PurchaseOrderItem, {
          purchaseOrderId: savedPo.id,
          unitId: item.unitId,
          quantity: item.quantity,
          importPrice: item.importPrice,
          subtotal,
        });
        await queryRunner.manager.save(PurchaseOrderItem, poItem);

        const baseQuantity = item.quantity * unit.conversionToBase;

        const batch = queryRunner.manager.create(Batch, {
          productId: item.productId,
          batchNumber: item.batchNumber,
          manufacturingDate: new Date(item.manufacturingDate),
          expiryDate: new Date(item.expiryDate),
          quantityRemaining: baseQuantity,
          importPrice: item.importPrice / unit.conversionToBase,
          status: BatchStatus.ACTIVE,
        });
        const savedBatch = await queryRunner.manager.save(Batch, batch);

        const log = queryRunner.manager.create(InventoryTransaction, {
          batchId: savedBatch.id,
          userId,
          transactionType: InventoryTransactionType.IMPORT,
          quantityChange: baseQuantity,
          remainingQuantity: baseQuantity,
          referenceType: 'PURCHASE_ORDER',
          referenceId: savedPo.id,
        });
        await queryRunner.manager.save(InventoryTransaction, log);
      }

      savedPo.totalCost = totalCost;
      await queryRunner.manager.save(PurchaseOrder, savedPo);

      await queryRunner.commitTransaction();
      return { success: true, purchaseOrderId: savedPo.id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Truy vấn các lô hàng cận hạn sử dụng (FEFO early-warning)
   */
  async getNearExpiryBatches(thresholdDays = 90): Promise<Batch[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + thresholdDays);

    return this.dataSource
      .getRepository(Batch)
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .where('batch.expiryDate <= :targetDate', { targetDate })
      .andWhere('batch.expiryDate > CURRENT_DATE')
      .andWhere('batch.quantityRemaining > 0')
      .orderBy('batch.expiryDate', 'ASC')
      .getMany();
  }

  /**
   * Cảnh báo thuốc chạm hoặc dưới ngưỡng tồn kho an toàn (Safety Stock)
   */
  async getLowStockAlerts(): Promise<LowStockAlertItem[]> {
    return this.dataSource
      .getRepository(Batch)
      .createQueryBuilder('batch')
      .select('batch.product_id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.safety_stock_threshold', 'threshold')
      .addSelect('SUM(batch.quantity_remaining)', 'totalStock')
      .innerJoin('batch.product', 'product')
      .where('batch.quantity_remaining > 0')
      .groupBy('batch.product_id')
      .addGroupBy('product.name')
      .addGroupBy('product.safety_stock_threshold')
      .having('SUM(batch.quantity_remaining) <= product.safety_stock_threshold')
      .getRawMany<LowStockAlertItem>();
  }
}
