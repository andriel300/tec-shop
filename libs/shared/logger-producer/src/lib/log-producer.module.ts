import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { LogProducerService } from './log-producer.service.js';

export interface LogProducerModuleOptions {
  clientId?: string;
}

@Global()
@Module({})
export class LogProducerModule {
  static forRoot(options?: LogProducerModuleOptions): DynamicModule {
    return {
      module: LogProducerModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'LOG_PRODUCER_KAFKA',
          useFactory: (config: ConfigService) => {
            const broker =
              config.get<string>('KAFKA_BROKER') ||
              config.get<string>('REDPANDA_BROKER') ||
              'localhost:9092';

            const clientId =
              options?.clientId ||
              config.get<string>('KAFKA_CLIENT_ID') ||
              'log-producer';

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
        LogProducerService,
      ],
      exports: [LogProducerService],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<LogProducerModuleOptions> | LogProducerModuleOptions;
    inject?: unknown[];
    imports?: unknown[];
  }): DynamicModule {
    return {
      module: LogProducerModule,
      imports: [ConfigModule, ...(options.imports || [])],
      providers: [
        {
          provide: 'LOG_PRODUCER_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: 'LOG_PRODUCER_KAFKA',
          useFactory: (
            config: ConfigService,
            moduleOptions: LogProducerModuleOptions
          ) => {
            const broker =
              config.get<string>('KAFKA_BROKER') ||
              config.get<string>('REDPANDA_BROKER') ||
              'localhost:9092';

            const clientId =
              moduleOptions?.clientId ||
              config.get<string>('KAFKA_CLIENT_ID') ||
              'log-producer';

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
          inject: [ConfigService, 'LOG_PRODUCER_OPTIONS'],
        },
        LogProducerService,
      ],
      exports: [LogProducerService],
    };
  }
}
