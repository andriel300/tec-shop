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
        // Get broker address (KAFKA_BROKER takes precedence)
        const broker =
          config.get<string>('KAFKA_BROKER') ||
          config.get<string>('REDPANDA_BROKER') ||
          'localhost:9092';

        const clientId =
          config.get<string>('KAFKA_CLIENT_ID') || 'chatting-service';

        // Check if this is a local broker (no SSL needed)
        const isLocalBroker =
          broker.startsWith('localhost') ||
          broker.startsWith('127.0.0.1') ||
          broker.startsWith('kafka:');

        // Check if authentication credentials are provided
        const username =
          config.get<string>('KAFKA_USERNAME') ||
          config.get<string>('REDPANDA_USERNAME');
        const password =
          config.get<string>('KAFKA_PASSWORD') ||
          config.get<string>('REDPANDA_PASSWORD');
        const hasCredentials = !!(username && password);

        // Only use SSL/SASL if credentials provided AND not a local broker
        // Can be overridden with KAFKA_SSL=true/false
        const sslOverride = config.get<string>('KAFKA_SSL');
        const useAuthentication =
          sslOverride === 'true' ||
          (hasCredentials && !isLocalBroker && sslOverride !== 'false');

        // Build Kafka configuration
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
    KafkaService,
  ],
  exports: ['KAFKA_CLIENT', KafkaService],
})
export class KafkaModule {}
