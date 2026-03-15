import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor, ErrorInterceptor, AllExceptionsFilter } from '@tec-shop/interceptor';
import { AppController } from './app.controller';
import { UserProfileService } from './user-profile.service';
import { UserFollowService } from './user-follow.service';
import { ShopFollowService } from './shop-follow.service';
import { ImageService } from './image.service';
import { ShippingAddressService } from './shipping-address.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogProducerModule } from '@tec-shop/logger-producer';
import { MetricsModule, HealthModule } from '@tec-shop/metrics';

@Module({
  imports: [
    MetricsModule,
    HealthModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    LogProducerModule.forRoot({ clientId: 'user-service' }),
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
          customProps: () => ({ service: 'user-service' }),
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
    UserProfileService,
    UserFollowService,
    ShopFollowService,
    ImageService,
    ShippingAddressService,
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
