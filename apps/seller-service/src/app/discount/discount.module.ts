import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { SellerPrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DiscountController],
  providers: [DiscountService, SellerPrismaService],
  exports: [DiscountService],
})
export class DiscountModule {}
