import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@tec-shop/user-prisma-client';

@Injectable()
export class UserPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    console.log('User service connected to prisma database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
