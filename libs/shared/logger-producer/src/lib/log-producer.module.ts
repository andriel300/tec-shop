import { Module, DynamicModule, Global, Type, ForwardReference } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { LogProducerService } from './log-producer.service.js';
import { buildKafkaConfig } from '@tec-shop/kafka-events'; // Import the shared helper

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
            const clientId =
              options?.clientId ||
              config.get<string>('KAFKA_CLIENT_ID') ||
              'log-producer';

            // Delegate all complex SSL/SASL logic to buildKafkaConfig
            return new Kafka(buildKafkaConfig(clientId));
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
    inject?: Array<string | symbol | Type<unknown>>;
    imports?: Array<DynamicModule | Type<unknown> | Promise<DynamicModule> | ForwardReference<unknown>>;
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
            const clientId =
              moduleOptions?.clientId ||
              config.get<string>('KAFKA_CLIENT_ID') ||
              'log-producer';

            // Delegate all complex SSL/SASL logic to buildKafkaConfig
            return new Kafka(buildKafkaConfig(clientId));
          },
          inject: [ConfigService, 'LOG_PRODUCER_OPTIONS'],
        },
        LogProducerService,
      ],
      exports: [LogProducerService],
    };
  }
}
