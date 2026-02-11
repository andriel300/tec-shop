import { Global, Module } from '@nestjs/common';
import { AnalyticsPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [AnalyticsPrismaService],
  exports: [AnalyticsPrismaService],
})
export class PrismaModule {}
