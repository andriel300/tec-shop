import { Global, Module } from '@nestjs/common';
import {
  AuthPrismaService,
  UserPrismaService,
  SellerPrismaService,
  OrderPrismaService,
} from './prisma.service';

@Global()
@Module({
  providers: [
    AuthPrismaService,
    UserPrismaService,
    SellerPrismaService,
    OrderPrismaService,
  ],
  exports: [
    AuthPrismaService,
    UserPrismaService,
    SellerPrismaService,
    OrderPrismaService,
  ],
})
export class PrismaModule {}
