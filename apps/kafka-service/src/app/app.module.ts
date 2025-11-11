import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from '../services/analytics.service';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
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
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  singleLine: true,
                },
              }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),

    // Database
    PrismaModule,
  ],
  controllers: [KafkaController],
  providers: [AnalyticsService],
})
export class AppModule {}
