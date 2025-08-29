import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // This method is called automatically by NestJS once the module has been initialized.
    // We connect to the database here.
    await this.$connect();
  }

  async onModuleDestroy() {
    // This method is called automatically by NestJS when the application is shutting down.
    // We disconnect from the database here for a graceful shutdown.
    await this.$disconnect();
  }
}
