import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicController } from './public.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PublicController],
  providers: [],
  exports: [],
})
export class PublicModule {}
