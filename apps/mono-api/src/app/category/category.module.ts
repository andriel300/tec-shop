import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoryController } from './category.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryController],
  providers: [],
  exports: [],
})
export class CategoryModule {}
