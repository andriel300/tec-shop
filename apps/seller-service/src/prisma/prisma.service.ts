import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@tec-shop/seller-client';

@Injectable()
export class SellerPrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('Seller-service connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
