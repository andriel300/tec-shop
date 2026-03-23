import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { EmailModule } from '../email/email.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [EmailModule, TrackingModule],
  providers: [ChannelService],
})
export class ChannelModule {}
