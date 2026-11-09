import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  RoleType,
  IPharmacyOverviewResponse,
  IUpdateProductPayload,
} from '@pharmacy/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('overview')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF)
  async getOverview(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<IPharmacyOverviewResponse> {
    return this.productsService.getOverview(search, categoryId);
  }

  @Post()
  @Roles(RoleType.ADMIN)
  async createProduct(@Body() body: any) {
    return await this.productsService.createProductWithUnits(body);
  }
  @Get('batches/:productId')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF)
  async getBatches(@Param('productId') productId: string) {
    return this.productsService.getBatchesByProductId(productId);
  }

  @Put(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async updateProduct(
    @Param('id') id: string,
    @Body() body: IUpdateProductPayload,
  ) {
    return this.productsService.updateProduct(id, body);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  async deleteProduct(@Param('id') id: string) {
    return await this.productsService.softDeleteProduct(id);
  }
}
