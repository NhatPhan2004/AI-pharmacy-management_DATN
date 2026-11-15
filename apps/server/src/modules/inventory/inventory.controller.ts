import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Param,
  BadRequestException,
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

interface UpsertSupplierBody {
  name?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
}
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  @Post('import')
  @Roles(RoleType.ADMIN)
  async importStock(
    @CurrentUser('id') userId: string,
    @Body()
    body: CreatePurchaseOrderInput & {
      invoiceNumber?: string;
      note?: string;
    },
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

  @Post('suppliers')
  @Roles(RoleType.ADMIN)
  async createSupplier(
    @Body() body: { name: string; phone?: string; address?: string },
  ): Promise<Supplier> {
    const repo = this.dataSource.getRepository(Supplier);
    const supplier = repo.create({
      name: body.name.trim(),
      phone: body.phone?.trim() || undefined,
      address: body.address?.trim() || undefined,
      isActive: true,
    });
    return repo.save(supplier);
  }
  @Patch('suppliers/:id')
  @Roles(RoleType.ADMIN)
  async updateSupplier(
    @Param('id') id: string,
    @Body() body: UpsertSupplierBody,
  ): Promise<Supplier> {
    const repo = this.dataSource.getRepository(Supplier);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) {
      throw new BadRequestException('Không tìm thấy nhà cung cấp');
    }

    await repo.update(id, {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.taxCode !== undefined && {
        taxCode: body.taxCode.trim() || undefined,
      }),
      ...(body.contactPerson !== undefined && {
        contactPerson: body.contactPerson.trim() || undefined,
      }),
      ...(body.phone !== undefined && {
        phone: body.phone.trim() || undefined,
      }),
      ...(body.email !== undefined && {
        email: body.email.trim() || undefined,
      }),
      ...(body.address !== undefined && {
        address: body.address.trim() || undefined,
      }),
    });

    return repo.findOneOrFail({ where: { id } });
  }

  @Delete('suppliers/:id')
  @Roles(RoleType.ADMIN)
  async deleteSupplier(@Param('id') id: string): Promise<{ success: boolean }> {
    const repo = this.dataSource.getRepository(Supplier);
    await repo.update(id, { isActive: false });
    return { success: true };
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
