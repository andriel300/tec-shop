import { Module } from '@nestjs/common';
import { ProductCatalogService } from './product-catalog.service';
import { ProductRatingService } from './product-rating.service';
import { ProductController } from './product.controller';
import { ProductCleanupService } from './product-cleanup.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SellerClientModule } from '../../clients/seller.client';

@Module({
  imports: [PrismaModule, SellerClientModule],
  controllers: [ProductController],
  providers: [ProductCatalogService, ProductRatingService, ProductCleanupService],
  exports: [ProductCatalogService, ProductRatingService],
})
export class ProductModule {}
