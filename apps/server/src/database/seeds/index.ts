import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { runInitialSeed } from './initial.seed';

async function bootstrap(): Promise<void> {
  console.log('🚀 Đang khởi động NestJS Context cho Seeder...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const dataSource = app.get(DataSource);

  try {
    await runInitialSeed(dataSource);
  } catch (error) {
    console.error('❌ Lỗi thực thi seed:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

void bootstrap();
