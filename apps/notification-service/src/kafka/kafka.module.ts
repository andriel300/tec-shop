import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { KafkaService } from './kafka.service';
import { buildKafkaConfig } from '@tec-shop/kafka-events';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: () => new Kafka(buildKafkaConfig('notification-service')),
    },
    KafkaService,
  ],
  exports: [KafkaService],
})
export class KafkaModule {}
