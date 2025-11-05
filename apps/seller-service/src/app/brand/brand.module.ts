import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { SellerPrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [BrandController],
  providers: [BrandService, SellerPrismaService],
  exports: [BrandService],
})
export class BrandModule {}
