import { Module } from '@nestjs/common';
import { OrderPrismaService } from './prisma.service';

@Module({
  providers: [OrderPrismaService],
  exports: [OrderPrismaService],
})
export class PrismaModule {}
