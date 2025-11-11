import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { KafkaProducerService } from '../../services/kafka-producer.service';

@Module({
  controllers: [AnalyticsController],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class AnalyticsModule {}
