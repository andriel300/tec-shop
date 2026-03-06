import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SellerModule } from './seller/seller.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { DiscountModule } from './discount/discount.module';
import { BrandModule } from './brand/brand.module';
import { OrderModule } from './order/order.module';
import { PublicModule } from './public/public.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { SentryTestModule } from './sentry-test/sentry-test.module';
import { EventModule } from './event/event.module';
import { NotificationModule } from './notification/notification.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { LoggerGrafanaModule } from './logger/logger.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { ChatModule } from './chat/chat.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsModule, HttpMetricsInterceptor, HealthModule } from '@tec-shop/metrics';
import { ImageKitModule } from '@tec-shop/shared/imagekit';
import { LogProducerModule } from '@tec-shop/logger-producer';
import { UserNotificationModule } from './user-notification/user-notification.module';
import { CircuitBreakerModule } from '../common/circuit-breaker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ImageKitModule.forRoot(),
    LogProducerModule.forRoot({ clientId: 'api-gateway' }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDevelopment = config.get<string>('NODE_ENV') !== 'production';

        return [
          {
            name: 'short',
            ttl: 60000, // 1 minute
            // Dev: 1000 req/min (unobtrusive), Prod: 100 req/min (protected)
            limit: isDevelopment ? 1000 : 100,
          },
          {
            name: 'medium',
            ttl: 900000, // 15 minutes
            // Dev: 100 attempts/15min, Prod: 20 attempts/15min (auth protection)
            limit: isDevelopment ? 100 : 20,
          },
          {
            name: 'long',
            ttl: 60000, // 1 minute
            // Dev: 2000 req/min (search-friendly), Prod: 200 req/min (protected)
            limit: isDevelopment ? 2000 : 200,
          },
        ];
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
              return url === '/api/metrics' || url.startsWith('/api/health');
            },
          },
          redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie'],
            censor: '[REDACTED]',
          },
          customProps: () => ({ service: 'api-gateway' }),
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
    AuthModule,
    UserModule,
    SellerModule,
    ProductModule,
    CategoryModule,
    BrandModule,
    DiscountModule,
    OrderModule,
    PublicModule,
    AnalyticsModule,
    AdminModule,
    SentryTestModule,
    EventModule,
    NotificationModule,
    ChatModule,
    LoggerGrafanaModule,
    RecommendationModule,
    UserNotificationModule,
    CircuitBreakerModule,
    MetricsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class AppModule {}
