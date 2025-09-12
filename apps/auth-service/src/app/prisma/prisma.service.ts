import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
// IMPORTANT: If you encounter "Must call super constructor in derived class" errors,
// ensure Prisma is installed directly within this service's package.json
// (e.g., apps/auth-service/package.json) rather than solely at the monorepo root.
// This ensures proper resolution and initialization of PrismaClient.
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
