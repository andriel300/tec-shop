import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SellerProfileService } from './seller-profile.service';

@Module({
  imports: [PrismaModule],
  providers: [SellerProfileService],
  exports: [SellerProfileService],
})
export class SellerModule {}
