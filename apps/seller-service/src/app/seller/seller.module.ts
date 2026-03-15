import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerProfileService } from './seller-profile.service';
import { ShopService } from './shop.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SellerController],
  providers: [SellerProfileService, ShopService],
  exports: [SellerProfileService, ShopService],
})
export class SellerModule {}
