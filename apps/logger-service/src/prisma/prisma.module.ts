import { Module } from '@nestjs/common';
import { LoggerPrismaService } from './prisma.service';

@Module({
  providers: [LoggerPrismaService],
  exports: [LoggerPrismaService],
})
export class PrismaModule {}
