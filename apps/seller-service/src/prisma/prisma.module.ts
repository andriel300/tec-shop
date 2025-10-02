import { Global, Module } from '@nestjs/common';
import { SellerPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [SellerPrismaService],
  exports: [SellerPrismaService],
})
export class PrismaModule {}