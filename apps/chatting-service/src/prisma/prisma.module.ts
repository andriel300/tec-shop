import { Module } from '@nestjs/common';
import { ChattingPrismaService } from './prisma.service';

@Module({
  providers: [ChattingPrismaService],
  exports: [ChattingPrismaService],
})
export class PrismaModule {}
