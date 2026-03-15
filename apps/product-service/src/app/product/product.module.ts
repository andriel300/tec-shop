import { Module } from '@nestjs/common';
import { ProductCatalogService } from './product-catalog.service';
import { ProductBrowseService } from './product-browse.service';
import { ProductRatingService } from './product-rating.service';
import { ProductController } from './product.controller';
import { ProductCleanupService } from './product-cleanup.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SellerClientModule } from '../../clients/seller.client';

@Module({
  imports: [PrismaModule, SellerClientModule],
  controllers: [ProductController],
  providers: [ProductCatalogService, ProductBrowseService, ProductRatingService, ProductCleanupService],
  exports: [ProductCatalogService, ProductBrowseService, ProductRatingService],
})
export class ProductModule {}
