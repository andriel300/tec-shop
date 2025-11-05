import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductCleanupService } from './product-cleanup.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SellerClientModule } from '../../clients/seller.client';

@Module({
  imports: [PrismaModule, SellerClientModule],
  controllers: [ProductController],
  providers: [ProductService, ProductCleanupService],
  exports: [ProductService],
})
export class ProductModule {}
