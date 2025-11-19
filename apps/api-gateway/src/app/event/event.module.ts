import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [SellerModule],
  controllers: [EventController],
})
export class EventModule {}
