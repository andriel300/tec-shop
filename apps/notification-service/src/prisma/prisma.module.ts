import { Module } from '@nestjs/common';
import { NotificationPrismaService } from './prisma.service';

@Module({
  providers: [NotificationPrismaService],
  exports: [NotificationPrismaService],
})
export class PrismaModule {}
