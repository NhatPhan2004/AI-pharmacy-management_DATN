import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MedicinesModule } from './medicines/medicines.module';
import { CategoriesModule } from './categories/categories.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [AuthModule, MedicinesModule, CategoriesModule, InvoicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
