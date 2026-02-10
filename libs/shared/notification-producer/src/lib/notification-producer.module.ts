import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { NotificationProducerService } from './notification-producer.service';

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
          useFactory: (config: ConfigService) => {
            const broker =
              config.get<string>('KAFKA_BROKER') ||
              config.get<string>('REDPANDA_BROKER') ||
              'localhost:9092';

            const clientId =
              options?.clientId ||
              config.get<string>('KAFKA_CLIENT_ID') ||
              'notification-producer';

            const isLocalBroker =
              broker.startsWith('localhost') ||
              broker.startsWith('127.0.0.1') ||
              broker.startsWith('kafka:');

            const username =
              config.get<string>('KAFKA_USERNAME') ||
              config.get<string>('REDPANDA_USERNAME');
            const password =
              config.get<string>('KAFKA_PASSWORD') ||
              config.get<string>('REDPANDA_PASSWORD');
            const hasCredentials = !!(username && password);

            const sslOverride = config.get<string>('KAFKA_SSL');
            const useAuthentication =
              sslOverride === 'true' ||
              (hasCredentials && !isLocalBroker && sslOverride !== 'false');

            const kafkaConfig: {
              clientId: string;
              brokers: string[];
              ssl?: boolean;
              sasl?: {
                mechanism: 'scram-sha-256';
                username: string;
                password: string;
              };
            } = {
              clientId,
              brokers: [broker],
            };

            if (useAuthentication && hasCredentials) {
              kafkaConfig.ssl = true;
              kafkaConfig.sasl = {
                mechanism: 'scram-sha-256',
                username: username as string,
                password: password as string,
              };
            }

            return new Kafka(kafkaConfig);
          },
          inject: [ConfigService],
        },
        NotificationProducerService,
      ],
      exports: [NotificationProducerService],
    };
  }
}
