import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SellerProfileService } from './seller-profile.service';
import { SellerController } from './seller.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SellerController],
  providers: [SellerProfileService],
  exports: [SellerProfileService],
})
export class SellerModule {}
