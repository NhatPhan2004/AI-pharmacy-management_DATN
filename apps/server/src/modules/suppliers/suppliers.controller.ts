import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@pharmacy/shared';

interface UpsertSupplierDto {
  name?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  @Get()
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF)
  findAll() {
    return this.supplierRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  @Post()
  @Roles(RoleType.ADMIN)
  async create(@Body() dto: UpsertSupplierDto & { code?: string }) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Tên nhà cung cấp không được để trống');
    }

    const generatedCode =
      dto.code?.trim() ||
      `NCC-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    const supplier = this.supplierRepo.create({
      code: generatedCode,
      name: dto.name.trim(),
      taxCode: dto.taxCode?.trim() || undefined,
      contactPerson: dto.contactPerson?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      email: dto.email?.trim() || undefined,
      address: dto.address?.trim() || undefined,
      isActive: true,
    });

    return this.supplierRepo.save(supplier);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpsertSupplierDto) {
    const existing = await this.supplierRepo.findOne({ where: { id } });
    if (!existing) {
      throw new BadRequestException('Không tìm thấy nhà cung cấp');
    }

    await this.supplierRepo.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.taxCode !== undefined && {
        taxCode: dto.taxCode.trim() || undefined,
      }),
      ...(dto.contactPerson !== undefined && {
        contactPerson: dto.contactPerson.trim() || undefined,
      }),
      ...(dto.phone !== undefined && { phone: dto.phone.trim() || undefined }),
      ...(dto.email !== undefined && { email: dto.email.trim() || undefined }),
      ...(dto.address !== undefined && {
        address: dto.address.trim() || undefined,
      }),
    });

    return this.supplierRepo.findOneOrFail({ where: { id } });
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  async remove(@Param('id') id: string) {
    await this.supplierRepo.update(id, { isActive: false });
    return { success: true };
  }
}
