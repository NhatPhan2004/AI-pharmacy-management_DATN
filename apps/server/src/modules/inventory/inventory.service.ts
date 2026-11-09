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
      let validUserId: string | null =
        userId && userId.length === 36 ? userId : null;
      if (!validUserId) {
        const firstUser = await queryRunner.manager.query<{ id: string }[]>(
          'SELECT id FROM users LIMIT 1',
        );
        if (firstUser.length > 0 && firstUser[0]?.id) {
          validUserId = firstUser[0].id;
        }
      }

      let totalCost = 0;

      const inputData = input as CreatePurchaseOrderInput & {
        invoiceNumber?: string;
        note?: string;
      };

      const po = queryRunner.manager.create(PurchaseOrder, {
        supplierId: input.supplierId,
        creatorId: validUserId || undefined,
        status: PurchaseOrderStatus.COMPLETED,
        poCode: `PO-${Date.now()}`,
        deliveryDate: new Date(),
        invoiceNumber: inputData.invoiceNumber || undefined,
        note: inputData.note || undefined,
      });
      const savedPo = await queryRunner.manager.save(PurchaseOrder, po);

      for (const item of input.items) {
        const unit = await queryRunner.manager.findOne(ProductUnit, {
          where: { id: item.unitId, productId: item.productId },
        });

        const conversionRate = unit ? Number(unit.conversionToBase) : 1;
        const subtotal = Number(item.quantity) * Number(item.importPrice);
        totalCost += subtotal;

        const poItem = queryRunner.manager.create(PurchaseOrderItem, {
          purchaseOrderId: savedPo.id,
          unitId: item.unitId,
          quantity: item.quantity,
          importPrice: item.importPrice,
          subtotal,
        });
        await queryRunner.manager.save(PurchaseOrderItem, poItem);

        const baseQuantity = Number(item.quantity) * conversionRate;

        const expDate = new Date(item.expiryDate);
        const mfgDate = item.manufacturingDate
          ? new Date(item.manufacturingDate)
          : new Date(new Date(expDate).setFullYear(expDate.getFullYear() - 2));

        const batch = queryRunner.manager.create(Batch, {
          productId: item.productId,
          batchNumber: item.batchNumber,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          quantityRemaining: baseQuantity,
          importPrice: Number(item.importPrice) / conversionRate,
          status: BatchStatus.ACTIVE,
        });
        const savedBatch = await queryRunner.manager.save(Batch, batch);

        const log = queryRunner.manager.create(InventoryTransaction, {
          batchId: savedBatch.id,
          userId: validUserId || undefined,
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
      console.error('Lỗi chi tiết khi nhập kho:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPurchaseOrders() {
    const list = await this.dataSource.getRepository(PurchaseOrder).find({
      relations: ['supplier', 'items'],
      order: {
        createdAt: 'DESC',
      },
    });

    return list.map((po) => ({
      id: po.id,
      poCode: po.poCode,
      createdAt: po.createdAt,
      supplierName: po.supplier?.name || 'Chưa xác định',
      totalCost: Number(po.totalCost || 0),
      status: po.status,
      itemCount: po.items?.length || 0,
    }));
  }

  async getPurchaseOrderDetail(id: string) {
    const po = await this.dataSource.getRepository(PurchaseOrder).findOne({
      where: { id },
      relations: ['supplier', 'items'],
    });

    if (!po) {
      throw new BadRequestException('Không tìm thấy phiếu nhập kho');
    }

    const itemsWithProduct = await Promise.all(
      (po.items || []).map(async (item) => {
        const unit = await this.dataSource.getRepository(ProductUnit).findOne({
          where: { id: item.unitId },
          relations: ['product'],
        });

        return {
          ...item,
          product: unit?.product || { name: 'Sản phẩm', sku: 'N/A' },
          unit: unit || undefined,
        };
      }),
    );

    return {
      ...po,
      items: itemsWithProduct,
    };
  }
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
