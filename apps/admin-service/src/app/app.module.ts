import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor, ErrorInterceptor, AllExceptionsFilter } from '@tec-shop/interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { NotificationProducerModule } from '@tec-shop/notification-producer';
import { MetricsModule, HealthModule, PrismaHealthIndicator } from '@tec-shop/metrics';
import { AuthPrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '' : '.env',
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
          customProps: () => ({ service: 'admin-service' }),
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
    PrismaModule,
    NotificationProducerModule.forRoot({ clientId: 'admin-service-notifications' }),
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'HEALTH_INDICATORS',
      useFactory: (prisma: AuthPrismaService) => [new PrismaHealthIndicator(prisma)],
      inject: [AuthPrismaService],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
