import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductUnit } from './entities/product-unit.entity';
import { Category } from '../categories/entities/category.entity';
import { Batch } from '../inventory/entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductUnit, Category, Batch])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
