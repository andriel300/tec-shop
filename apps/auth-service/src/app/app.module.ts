import { Module } from '@nestjs/common';
import { z } from 'zod';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor, ErrorInterceptor, AllExceptionsFilter } from '@tec-shop/interceptor';
import { LogProducerModule } from '@tec-shop/logger-producer';
import { MetricsModule, HealthModule } from '@tec-shop/metrics';
import { NotificationProducerModule } from '@tec-shop/notification-producer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '' : '.env',
      validate: (config: Record<string, unknown>) => {
        if (config['NODE_ENV'] === 'test') return config;
        const schema = z.object({
          NODE_ENV: z.enum(['development', 'production']).default('development'),
          PORT: z.coerce.number().default(6001),
          JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
          SERVICE_MASTER_SECRET: z.string().min(32, 'SERVICE_MASTER_SECRET must be at least 32 characters'),
          AUTH_SERVICE_DB_URL: z.string().min(1, 'AUTH_SERVICE_DB_URL is required'),
          OTP_SALT: z.string().min(1, 'OTP_SALT is required'),
        });
        const result = schema.safeParse(config);
        if (!result.success) {
          throw new Error(`Config validation failed:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
        }
        return result.data;
      },
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        pinoHttp: {
          level:
            config.get<string>('NODE_ENV') !== 'production' ? 'debug' : 'info',
          autoLogging: {
            ignore: (req) => {
              const url = req.url ?? '';
              return url === '/metrics' || url.startsWith('/health');
            },
          },
          redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie'],
            censor: '[REDACTED]',
          },
          customProps: () => ({ service: 'auth-service' }),
          transport:
            config.get<string>('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname,req.headers,res.headers',
                  },
                }
              : undefined,
        },
      }),
    }),
    MetricsModule,
    HealthModule,
    AuthModule,
    LogProducerModule.forRoot({ clientId: 'auth-service' }),
    NotificationProducerModule.forRoot({ clientId: 'auth-service-notifications' }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    {
      provide: APP_FILTER, // Provide the global exception filter
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}