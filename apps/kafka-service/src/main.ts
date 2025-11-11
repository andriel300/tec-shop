import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('KafkaServiceBootstrap');

  try {
    // Validate environment variables
    const requiredEnvVars = [
      'ANALYTICS_SERVICE_DB_URL',
      'REDPANDA_USERNAME',
      'REDPANDA_PASSWORD',
      'REDPANDA_BROKER',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    logger.log('Environment variables validated successfully');

    // Create Kafka microservice
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'kafka-service',
            brokers: [process.env.REDPANDA_BROKER as string],
            ssl: true,
            sasl: {
              mechanism: 'scram-sha-256',
              username: process.env.REDPANDA_USERNAME as string,
              password: process.env.REDPANDA_PASSWORD as string,
            },
            connectionTimeout: 10000,
            requestTimeout: 30000,
          },
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
    logger.log('Kafka microservice connected to Redpanda Cloud');
    logger.log(
      'Listening to topic: users-events (group: kafka-service-group)'
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
