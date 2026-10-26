import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService, LowStockAlertItem } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePurchaseOrderInput, RoleType } from '@pharmacy/shared';
import { Batch } from './entities/batch.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('import')
  @Roles(RoleType.ADMIN)
  async importStock(
    @CurrentUser('id') userId: string,
    @Body() body: CreatePurchaseOrderInput,
  ): Promise<{ success: boolean; purchaseOrderId: string }> {
    return this.inventoryService.importPurchaseOrder(userId, body);
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
}
