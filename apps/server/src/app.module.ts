import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';

import { Batch } from './modules/inventory/entities/batch.entity';
import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/users/entities/role.entity';
import { Supplier } from './modules/suppliers/entities/supplier.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Product } from './modules/products/entities/product.entity';
import { ProductUnit } from './modules/products/entities/product-unit.entity';
import { PurchaseOrder } from './modules/inventory/entities/purchase-order.entity';
import { PurchaseOrderItem } from './modules/inventory/entities/purchase-order-item.entity';
import { InventoryTransaction } from './modules/inventory/entities/inventory-transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'pharmacy_db'),
        entities: [
          User,
          Role,
          Product,
          ProductUnit,
          Batch,
          PurchaseOrder,
          PurchaseOrderItem,
          InventoryTransaction,
          Supplier,
          Category,
        ],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    InventoryModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {}
}
