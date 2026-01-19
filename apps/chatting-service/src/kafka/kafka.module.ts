import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { KafkaService } from './kafka.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: (config: ConfigService) => {
        const broker =
          config.get<string>('REDPANDA_BROKER') || 'localhost:9092';

        const clientId =
          config.get<string>('KAFKA_CLIENT_ID') || 'chatting-service';

        return new Kafka({
          clientId,
          brokers: [broker],
        });
      },
      inject: [ConfigService],
    },
    KafkaService,
  ],
  exports: ['KAFKA_CLIENT', KafkaService],
})
export class KafkaModule {}
