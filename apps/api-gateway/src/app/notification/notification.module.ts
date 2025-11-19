import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [SellerModule],
  controllers: [NotificationController],
})
export class NotificationModule {}
