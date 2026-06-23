import { Module } from '@nestjs/common';
import { MonoPrismaService } from './prisma.service';

@Module({
  providers: [MonoPrismaService],
  exports: [MonoPrismaService],
})
export class PrismaModule {}
