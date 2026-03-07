import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor, ErrorInterceptor, AllExceptionsFilter } from '@tec-shop/interceptor';
import { AppController } from './app.controller';
import { OrderService } from './order.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '@tec-shop/redis-client';
import { EmailModule } from './email/email.module';
import { UserClientModule } from '../clients/user.client';
import { SellerClientModule } from '../clients/seller.client';
import { ProductClientModule } from '../clients/product.client';
import { PaymentService } from '../services/payment.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { WebhookService } from '../services/webhook.service';
import { MockLogisticsService } from '../services/mock-logistics.service';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationProducerModule } from '@tec-shop/notification-producer';
import { MetricsModule, HealthModule } from '@tec-shop/metrics';

@Module({
  imports: [
    MetricsModule,
    HealthModule,
    PrismaModule,
    RedisModule.forRoot(),
    EmailModule,
    UserClientModule,
    SellerClientModule,
    ProductClientModule,
    NotificationProducerModule.forRoot({ clientId: 'order-service-notifications' }),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
          customProps: () => ({ service: 'order-service' }),
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
  ],
  controllers: [AppController],
  providers: [
    OrderService,
    PaymentService,
    KafkaProducerService,
    WebhookService,
    MockLogisticsService,
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
