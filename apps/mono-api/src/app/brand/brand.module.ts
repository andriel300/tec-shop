import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrandController } from './brand.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BrandController],
  providers: [],
  exports: [],
})
export class BrandModule {}
