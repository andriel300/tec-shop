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
import { PublicModule } from './public/public.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SentryTestModule } from './sentry-test/sentry-test.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ImageKitModule } from '@tec-shop/shared/imagekit';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ImageKitModule.forRoot(),
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
          transport:
            config.get<string>('NODE_ENV') !== 'production'
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
    }),
    AuthModule,
    UserModule,
    SellerModule,
    ProductModule,
    CategoryModule,
    BrandModule,
    DiscountModule,
    PublicModule,
    AnalyticsModule,
    SentryTestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
