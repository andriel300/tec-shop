import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { AllExceptionsFilter } from './filters/rpc-exception.filter';
import { LogProducerModule } from '@tec-shop/logger-producer';
import { NotificationProducerModule } from '@tec-shop/notification-producer';

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