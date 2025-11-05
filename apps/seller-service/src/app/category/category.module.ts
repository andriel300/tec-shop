import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { SellerPrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, SellerPrismaService],
  exports: [CategoryService],
})
export class CategoryModule {}
