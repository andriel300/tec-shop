import { Module } from '@nestjs/common';
import { MetricsModule, HealthModule } from '@tec-shop/metrics';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from '../services/analytics.service';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
    MetricsModule,
    HealthModule,

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config) => {
        const requiredEnvVars = [
          'ANALYTICS_SERVICE_DB_URL',
          'REDPANDA_USERNAME',
          'REDPANDA_PASSWORD',
          'REDPANDA_BROKER',
        ];

        for (const envVar of requiredEnvVars) {
          if (!config[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
          }
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
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_DLQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const broker =
            config.get<string>('KAFKA_BROKER') ||
            config.get<string>('REDPANDA_BROKER') ||
            'localhost:9092';
          return {
            transport: Transport.KAFKA,
            options: {
              client: { clientId: 'kafka-service-dlq', brokers: [broker] },
              producer: {},
            },
          };
        },
      },
    ]),
  ],
  controllers: [KafkaController],
  providers: [AnalyticsService],
})
export class AppModule {}
