import { Module } from '@nestjs/common';
import { z } from 'zod';
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
import { ThrottlerModule } from '@nestjs/throttler';
import { ConditionalThrottlerGuard } from '../guards/conditional-throttler.guard';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SentryModule, SentryInterceptor, SentryContextMiddleware } from '@tec-shop/sentry';
import { RedisModule } from '@tec-shop/redis-client';
import { MetricsModule, HttpMetricsInterceptor, HealthModule } from '@tec-shop/metrics';
import { ImageKitModule } from '@tec-shop/shared/imagekit';
import { LogProducerModule } from '@tec-shop/logger-producer';
import { UserNotificationModule } from './user-notification/user-notification.module';
import { CircuitBreakerModule } from '../common/circuit-breaker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        if (config['NODE_ENV'] === 'test') return config;
        const schema = z.object({
          NODE_ENV: z.enum(['development', 'production']).default('development'),
          PORT: z.coerce.number().default(8080),
          JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
          REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
          CORS_ORIGINS: z.string().optional(),
        });
        const result = schema.safeParse(config);
        if (!result.success) {
          throw new Error(`Config validation failed:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
        }
        return result.data;
      },
    }),
    ImageKitModule.forRoot(),
    LogProducerModule.forRoot({ clientId: 'api-gateway' }),
    RedisModule.forRoot(),

    // Define the ThrottlerStorageModule inline or in a separate file
    ThrottlerModule.forRootAsync({
      imports: [
        ConfigModule,
        // Define a dynamic module to provide the Redis Storage Service
        {
          module: class ThrottlerStorageModule { },
          providers: [
            {
              provide: ThrottlerStorageRedisService,
              useFactory: (config: ConfigService) => {
                const redisUrl = config.get<string>('REDIS_URL');
                if (!redisUrl) {
                  throw new Error('REDIS_URL environment variable not set');
                }
                return new ThrottlerStorageRedisService(redisUrl);
              },
              inject: [ConfigService],
            },
          ],
          exports: [ThrottlerStorageRedisService],
        },
      ],
      inject: [ThrottlerStorageRedisService, ConfigService],
      useFactory: (
        storage: ThrottlerStorageRedisService,
        config: ConfigService,
      ) => {
        const isDevelopment = config.get<string>('NODE_ENV') !== 'production';

        return {
          storage: storage, // Injected instance
          throttlers: [
            {
              name: 'short',
              ttl: 60000,
              limit: isDevelopment ? 1000 : 100,
            },
            {
              name: 'medium',
              ttl: 900000,
              limit: isDevelopment ? 100 : 20,
            },
            {
              name: 'long',
              ttl: 60000,
              limit: isDevelopment ? 2000 : 200,
            },
          ],
        };
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
    SentryModule.forRoot({ serviceName: 'api-gateway', transport: 'HTTP' }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ConditionalThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SentryContextMiddleware).forRoutes('*');
  }
}
