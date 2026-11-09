import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductUnit } from './entities/product-unit.entity';
import type {
  IBatchItem,
  IPharmacyOverviewResponse,
  IProductItem,
} from '@pharmacy/shared';
import { Batch } from '../inventory/entities/batch.entity';

export interface CreateProductUnitDto {
  unitName: string;
  conversionToBase: number;
  sellingPrice: number;
  isBaseUnit: boolean;
}

export interface CreateProductInputDto {
  sku: string;
  name: string;
  categoryId: string;
  safetyStockThreshold?: number;
  usageInstructions?: string;
  defaultStorage?: string;
  units: CreateProductUnitDto[];
}
export interface IUpdateProductInput {
  name?: string;
  categoryId?: string;
  safetyStockThreshold?: number;
  usageInstructions?: string;
  defaultStorage?: string;
  units?: Array<{
    id?: string;
    unitName: string;
    conversionToBase: number;
    sellingPrice: number;
    isBaseUnit: boolean;
  }>;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async getOverview(
    search?: string,
    categoryId?: string,
  ): Promise<IPharmacyOverviewResponse> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .leftJoinAndSelect('p.units', 'u')
      .leftJoinAndSelect('p.batches', 'b', 'b.quantity_remaining > 0')
      .where('p.isActive = :active', { active: true });

    if (search) {
      qb.andWhere('(p.name ILIKE :search OR p.sku ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (categoryId && categoryId !== 'ALL') {
      qb.andWhere('p.categoryId = :categoryId', { categoryId });
    }

    const products = await qb.getMany();

    const now = new Date();
    const nearExpiryDate = new Date();
    nearExpiryDate.setDate(now.getDate() + 90);

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let nearExpiryCount = 0;

    const items: IProductItem[] = products.map((prod) => {
      const totalQuantityBase = (prod.batches || []).reduce(
        (acc, b) => acc + Number(b.quantityRemaining || 0),
        0,
      );

      const sortedBatches = [...(prod.batches || [])].sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
      );
      const nearestBatch = sortedBatches[0];
      const nearestExpiryDate = nearestBatch
        ? new Date(nearestBatch.expiryDate).toISOString()
        : null;

      const baseUnit = prod.units?.find((u) => u.isBaseUnit) || prod.units?.[0];
      const largestUnit = prod.units
        ?.slice()
        .sort((a, b) => b.conversionToBase - a.conversionToBase)[0];

      let packagingDisplay = `${totalQuantityBase} ${baseUnit?.unitName || 'Đơn vị'}`;
      if (
        largestUnit &&
        largestUnit.conversionToBase > 1 &&
        totalQuantityBase >= largestUnit.conversionToBase
      ) {
        const largeCount = Math.floor(
          totalQuantityBase / largestUnit.conversionToBase,
        );
        const remainBase = totalQuantityBase % largestUnit.conversionToBase;
        packagingDisplay =
          remainBase > 0
            ? `${largeCount} ${largestUnit.unitName} + ${remainBase} ${baseUnit?.unitName}`
            : `${largeCount} ${largestUnit.unitName} (${totalQuantityBase} ${baseUnit?.unitName})`;
      }

      const prices = (prod.units || [])
        .map((u) => Number(u.sellingPrice))
        .filter((p) => !isNaN(p));
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      let status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'NEAR_EXPIRY' | 'LOW_STOCK' =
        'IN_STOCK';
      if (totalQuantityBase === 0) {
        status = 'OUT_OF_STOCK';
        outOfStockCount++;
      } else if (
        nearestBatch &&
        new Date(nearestBatch.expiryDate) <= nearExpiryDate
      ) {
        status = 'NEAR_EXPIRY';
        nearExpiryCount++;
      } else if (totalQuantityBase <= (prod.safetyStockThreshold || 20)) {
        status = 'LOW_STOCK';
        lowStockCount++;
      }

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        activeIngredient: prod.usageInstructions || 'Chưa cập nhật',
        categoryId: prod.categoryId,
        categoryName: prod.category?.name || 'Chưa phân loại',
        usageInstructions: prod.usageInstructions,
        defaultStorage: prod.defaultStorage,
        safetyStockThreshold: prod.safetyStockThreshold,
        totalQuantityBase,
        baseUnitName: baseUnit?.unitName || 'Đơn vị',
        packagingDisplay,
        nearestExpiryDate,
        minPrice,
        maxPrice,
        status,
        units: (prod.units || []).map((u) => ({
          id: u.id,
          unitName: u.unitName,
          conversionToBase: u.conversionToBase,
          sellingPrice: Number(u.sellingPrice),
          isBaseUnit: u.isBaseUnit,
        })),
      };
    });

    return {
      metrics: {
        totalProducts: products.length,
        lowStockCount,
        outOfStockCount,
        nearExpiryCount,
      },
      items,
    };
  }
  async getBatchesByProductId(productId: string): Promise<IBatchItem[]> {
    const batchRepo = this.dataSource.getRepository(Batch);
    const batches = await batchRepo.find({
      where: { productId },
      order: { expiryDate: 'ASC' },
    });

    const now = new Date();
    let foundFefo = false;

    return batches.map((b) => {
      const exp = new Date(b.expiryDate);
      const diffTime = exp.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const qtyRemaining = Number(b.quantityRemaining || 0);

      let status: 'SAFE' | 'DEPLETED' | 'EXPIRED' | 'NEAR_EXPIRY' = 'SAFE';
      if (qtyRemaining <= 0) {
        status = 'DEPLETED';
      } else if (daysUntilExpiry <= 0) {
        status = 'EXPIRED';
      } else if (daysUntilExpiry <= 90) {
        status = 'NEAR_EXPIRY';
      }

      let isFefoPriority = false;
      if (!foundFefo && qtyRemaining > 0 && status !== 'EXPIRED') {
        isFefoPriority = true;
        foundFefo = true;
      }

      return {
        id: b.id,
        productId: b.productId,
        batchNumber: b.batchNumber,
        initialQuantity: qtyRemaining,
        quantityRemaining: qtyRemaining,
        costPrice: 0,
        manufactureDate: b.manufacturingDate
          ? new Date(b.manufacturingDate).toISOString()
          : null,
        expiryDate: new Date(b.expiryDate).toISOString(),
        isFefoPriority,
        daysUntilExpiry,
        status,
      };
    });
  }

  async updateProduct(
    id: string,
    input: IUpdateProductInput,
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id },
      });
      if (!product) {
        throw new BadRequestException('Không tìm thấy thuốc');
      }

      if (input.name !== undefined) product.name = input.name;
      if (input.categoryId !== undefined) product.categoryId = input.categoryId;
      if (input.safetyStockThreshold !== undefined) {
        product.safetyStockThreshold = Number(input.safetyStockThreshold);
      }
      if (input.usageInstructions !== undefined)
        product.usageInstructions = input.usageInstructions;
      if (input.defaultStorage !== undefined)
        product.defaultStorage = input.defaultStorage;

      await queryRunner.manager.save(Product, product);

      if (Array.isArray(input.units) && input.units.length > 0) {
        await queryRunner.manager.delete(ProductUnit, { productId: id });

        const unitEntities = input.units.map((u) => {
          const unit = new ProductUnit();
          unit.productId = id;
          unit.unitName = u.unitName;
          unit.conversionToBase = u.isBaseUnit ? 1 : Number(u.conversionToBase);
          unit.sellingPrice = Number(u.sellingPrice);
          unit.isBaseUnit = Boolean(u.isBaseUnit);
          return unit;
        });

        await queryRunner.manager.save(ProductUnit, unitEntities);
      }

      await queryRunner.commitTransaction();
      return product;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async createProductWithUnits(input: {
    sku: string;
    name: string;
    categoryId: string;
    safetyStockThreshold?: number;
    usageInstructions?: string;
    defaultStorage?: string;
    units: Array<{
      unitName: string;
      conversionToBase: number;
      sellingPrice: number;
      isBaseUnit: boolean;
    }>;
  }): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingSku = await queryRunner.manager.findOne(Product, {
        where: { sku: input.sku },
      });
      if (existingSku) {
        throw new BadRequestException(
          `Mã SKU ${input.sku} đã tồn tại trong hệ thống.`,
        );
      }

      const product = new Product();
      product.sku = input.sku;
      product.name = input.name;
      product.categoryId = input.categoryId;
      product.safetyStockThreshold = Number(input.safetyStockThreshold) || 20;
      product.usageInstructions = input.usageInstructions || '';
      product.defaultStorage = input.defaultStorage || '';
      product.isActive = true;

      const savedProduct = await queryRunner.manager.save(Product, product);

      if (input.units && Array.isArray(input.units) && input.units.length > 0) {
        const units = input.units.map((u) => {
          const unit = new ProductUnit();
          unit.productId = savedProduct.id;
          unit.unitName = u.unitName;
          unit.conversionToBase = u.isBaseUnit ? 1 : Number(u.conversionToBase);
          unit.sellingPrice = Number(u.sellingPrice);
          unit.isBaseUnit = Boolean(u.isBaseUnit);
          return unit;
        });

        await queryRunner.manager.save(ProductUnit, units);
      }

      await queryRunner.commitTransaction();
      return savedProduct;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async softDeleteProduct(id: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new BadRequestException('Không tìm thấy thuốc');
    }
    product.isActive = false;
    await this.productRepo.save(product);
  }
}
