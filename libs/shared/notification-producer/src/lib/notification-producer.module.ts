import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { NotificationProducerService } from './notification-producer.service.js';
import { buildKafkaConfig } from '@tec-shop/kafka-events';

export interface NotificationProducerModuleOptions {
  clientId?: string;
}

@Global()
@Module({})
export class NotificationProducerModule {
  static forRoot(options?: NotificationProducerModuleOptions): DynamicModule {
    return {
      module: NotificationProducerModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'NOTIFICATION_PRODUCER_KAFKA',
          useFactory: () => {
            const clientId =
              options?.clientId ||
              process.env.KAFKA_CLIENT_ID ||
              'notification-producer';
            return new Kafka(buildKafkaConfig(clientId));
          },
        },
        NotificationProducerService,
      ],
      exports: [NotificationProducerService],
    };
  }
}
