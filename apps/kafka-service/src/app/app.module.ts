import { Module } from '@nestjs/common';
import { MetricsModule, HealthModule } from '@tec-shop/metrics';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@tec-shop/sentry';
import { LoggerModule } from 'nestjs-pino';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaConfig } from '@tec-shop/kafka-events';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from '../services/analytics.service';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
    MetricsModule,
    HealthModule,
    SentryModule.forRoot({ serviceName: 'kafka-service', transport: 'Kafka' }),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config) => {
        // Only the DB URL is always required; Kafka broker/credentials are
        // optional — local dev uses KAFKA_BROKER=localhost:9092 with no auth.
        if (!config['ANALYTICS_SERVICE_DB_URL']) {
          throw new Error('Missing required environment variable: ANALYTICS_SERVICE_DB_URL');
        }

        const broker = config['KAFKA_BROKER'] || config['REDPANDA_BROKER'];
        if (!broker) {
          throw new Error(
            'Missing required environment variable: KAFKA_BROKER (or legacy REDPANDA_BROKER)'
          );
        }

        return config;
      },
    }),

    // Logging
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        autoLogging: {
          ignore: (req) => {
            const url = req.url ?? '';
            return url === '/metrics' || url.startsWith('/health');
          },
        },
        customProps: () => ({ service: 'kafka-service' }),
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    }),

    // Database
    PrismaModule,

    // DLQ producer client
    ClientsModule.register([
      {
        name: 'KAFKA_DLQ_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: buildKafkaConfig('kafka-service-dlq'),
          producer: {},
        },
      },
    ]),
  ],
  controllers: [KafkaController],
  providers: [AnalyticsService],
})
export class AppModule {}
