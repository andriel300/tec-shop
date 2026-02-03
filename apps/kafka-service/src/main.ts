import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('KafkaServiceBootstrap');

  try {
    // Validate required environment variables
    const kafkaBroker = process.env.KAFKA_BROKER || process.env.REDPANDA_BROKER;
    if (!kafkaBroker) {
      throw new Error('Missing required environment variable: KAFKA_BROKER');
    }

    if (!process.env.ANALYTICS_SERVICE_DB_URL) {
      throw new Error(
        'Missing required environment variable: ANALYTICS_SERVICE_DB_URL'
      );
    }

    logger.log('Environment variables validated successfully');

    // Check if this is a local broker (no SSL needed)
    const isLocalBroker =
      kafkaBroker.startsWith('localhost') ||
      kafkaBroker.startsWith('127.0.0.1') ||
      kafkaBroker.startsWith('kafka:');

    // Check if authentication credentials are provided (for production/cloud)
    const username = process.env.KAFKA_USERNAME || process.env.REDPANDA_USERNAME;
    const password = process.env.KAFKA_PASSWORD || process.env.REDPANDA_PASSWORD;
    const hasCredentials = !!(username && password);

    // Only use SSL/SASL if credentials provided AND not a local broker
    // Can be overridden with KAFKA_SSL=true/false
    const sslOverride = process.env.KAFKA_SSL;
    const useAuthentication =
      sslOverride === 'true' ||
      (hasCredentials && !isLocalBroker && sslOverride !== 'false');

    if (useAuthentication && hasCredentials) {
      logger.log('Kafka authentication enabled (SCRAM-SHA-256 + SSL)');
    } else {
      logger.log(
        `Kafka authentication disabled (broker: ${kafkaBroker}, local: ${isLocalBroker})`
      );
    }

    // Build Kafka client configuration
    const clientConfig: Record<string, unknown> = {
      clientId: 'kafka-service',
      brokers: [kafkaBroker],
      connectionTimeout: 10000,
      requestTimeout: 30000,
    };

    if (useAuthentication && hasCredentials) {
      clientConfig.ssl = true;
      clientConfig.sasl = {
        mechanism: 'scram-sha-256',
        username: username as string,
        password: password as string,
      };
    }

    // Create Kafka microservice
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.KAFKA,
        options: {
          client: clientConfig,
          consumer: {
            groupId: 'kafka-service-group',
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            allowAutoTopicCreation: false,
          },
        },
      }
    );

    // Start microservice
    await app.listen();
    logger.log('Kafka microservice connected successfully');
    logger.log(
      'Listening to topic: users-event (group: kafka-service-group)'
    );
    logger.log('Kafka service is ready to process analytics events');
  } catch (error) {
    logger.error(
      'Failed to bootstrap Kafka microservice',
      error instanceof Error ? error.stack : undefined
    );
    process.exit(1);
  }
}

bootstrap();
