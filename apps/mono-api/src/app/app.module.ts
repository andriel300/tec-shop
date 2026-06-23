import { Module } from '@nestjs/common';
import { z } from 'zod';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisModule } from '@tec-shop/redis-client';
import { HealthModule } from '@tec-shop/metrics';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SellerModule } from './seller/seller.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { AdminModule } from './admin/admin.module';
import { BrandModule } from './brand/brand.module';
import { CategoryModule } from './category/category.module';
import { DiscountModule } from './discount/discount.module';
import { EventModule } from './event/event.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        if (config['NODE_ENV'] === 'test') return config;
        const schema = z.object({
          NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
          PORT: z.coerce.number().default(8080),
          DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
          JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
          REDIS_URL: z.string().optional(),
          CORS_ORIGINS: z.string().optional(),
          FRONTEND_URL: z.string().default('http://localhost:3000'),
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
          level: config.get<string>('NODE_ENV') !== 'production' ? 'debug' : 'info',
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
          customProps: () => ({ service: 'mono-api' }),
          transport: config.get<string>('NODE_ENV') !== 'production'
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
    RedisModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDevelopment = config.get<string>('NODE_ENV') !== 'production';
        const redisUrl = config.get<string>('REDIS_URL');

        return {
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
    PrismaModule,
    AuthModule,
    UserModule,
    SellerModule,
    ProductModule,
    OrderModule,
    AdminModule,
    BrandModule,
    CategoryModule,
    DiscountModule,
    EventModule,
    PublicModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
