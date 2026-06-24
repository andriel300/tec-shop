import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
