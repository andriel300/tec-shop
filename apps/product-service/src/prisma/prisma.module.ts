import { Global, Module } from '@nestjs/common';
import { ProductPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [ProductPrismaService],
  exports: [ProductPrismaService],
})
export class PrismaModule {}
