import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryService, LowStockAlertItem } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePurchaseOrderInput, RoleType } from '@pharmacy/shared';
import { Batch } from './entities/batch.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  @Post('import')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF)
  async importStock(
    @CurrentUser('id') userId: string,
    @Body() body: CreatePurchaseOrderInput,
  ): Promise<{ success: boolean; purchaseOrderId: string }> {
    return this.inventoryService.importPurchaseOrder(userId, body);
  }

  @Get('suppliers')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF)
  async getSuppliers(): Promise<Supplier[]> {
    return this.dataSource.getRepository(Supplier).find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  @Get('near-expiry')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async getNearExpiryBatches(@Query('days') days?: number): Promise<Batch[]> {
    return this.inventoryService.getNearExpiryBatches(days ? Number(days) : 90);
  }

  @Get('low-stock')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async getLowStockAlerts(): Promise<LowStockAlertItem[]> {
    return this.inventoryService.getLowStockAlerts();
  }

  @Get('purchase-orders')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF)
  async getPurchaseOrders() {
    return this.inventoryService.getPurchaseOrders();
  }

  @Get('purchase-orders/:id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF)
  async getPurchaseOrderDetail(@Param('id') id: string) {
    return this.inventoryService.getPurchaseOrderDetail(id);
  }
}
