import { Module } from '@nestjs/common';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DeliveryTrackingService],
  exports: [DeliveryTrackingService],
})
export class TrackingModule {}
