import { Module } from '@nestjs/common';
import { UserPrismaService } from './prisma.service';

@Module({
  providers: [UserPrismaService],
  exports: [UserPrismaService],
})
export class PrismaModule {}
