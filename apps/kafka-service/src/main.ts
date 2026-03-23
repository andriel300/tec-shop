import { initializeTracing } from '@tec-shop/tracing';
initializeTracing('kafka-service');

import { initializeSentryForService } from './instrumentation';
initializeSentryForService('kafka-service');

import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import { buildKafkaConfig } from '@tec-shop/kafka-events';

async function bootstrap() {
  const logger = new Logger('KafkaServiceBootstrap');

  try {
    if (!process.env.KAFKA_BROKER && !process.env.REDPANDA_BROKER) {
      throw new Error('Missing required environment variable: KAFKA_BROKER');
    }

    if (!process.env.ANALYTICS_SERVICE_DB_URL) {
      throw new Error(
        'Missing required environment variable: ANALYTICS_SERVICE_DB_URL'
      );
    }

    logger.log('Environment variables validated successfully');

    const clientConfig = buildKafkaConfig('kafka-service', {
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });

    const hasSsl = !!clientConfig.ssl;
    logger.log(
      hasSsl
        ? 'Kafka mTLS/SSL enabled'
        : `Kafka plain (broker: ${clientConfig.brokers[0]})`
    );

    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    app.connectMicroservice<MicroserviceOptions>({
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
    });

    const gracefulShutdown = async (signal: string) => {
      logger.log(`Received ${signal}, starting graceful shutdown`);
      const forceExit = setTimeout(() => {
        logger.error('Forced exit after 30s timeout');
        process.exit(1);
      }, 30_000);
      forceExit.unref();
      await app.close();
      clearTimeout(forceExit);
    };
    process.once('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
    process.once('SIGINT', () => { void gracefulShutdown('SIGINT'); });

    await app.startAllMicroservices();
    const metricsPort = parseInt(process.env.KAFKA_SERVICE_METRICS_PORT ?? '9009', 10);
    await app.listen(metricsPort, '0.0.0.0');

    logger.log('Kafka microservice connected successfully');
    logger.log('Listening to topic: users-event (group: kafka-service-group)');
    logger.log(`Kafka service ready to process analytics events, metrics on port ${metricsPort}`);
  } catch (error) {
    logger.error(
      'Failed to bootstrap Kafka microservice',
      error instanceof Error ? error.stack : undefined
    );
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(`Unhandled Rejection at: ${String(promise)}, reason: ${String(reason)}`, undefined, 'Bootstrap');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', error instanceof Error ? error.stack : String(error), 'Bootstrap');
  process.exit(1);
});

bootstrap();
