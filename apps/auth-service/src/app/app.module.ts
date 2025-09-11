import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
  Logger,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { EmailModule } from '../email/email.module';
import { LoggerMiddleware } from '@tec-shop/middleware';
import { AllExceptionsFilter } from '@tec-shop/exceptions';
import { ConfigModule } from '@nestjs/config';
import { RequestLoggerMiddleware } from '../common/middleware/request-logger.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigService available throughout the app
      envFilePath: './apps/auth-service/.env', // Path to your .env file
    }),
    AuthModule,
    RedisModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD, // This is the key that tells NestJS to apply it globally
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})

// Applying of middleware of my entire auth-service API
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) // Keep the existing LoggerMiddleware
      .forRoutes({ path: '*path', method: RequestMethod.ALL });

    consumer
      .apply(RequestLoggerMiddleware) // Apply the custom logger
      .forRoutes({ path: '*path', method: RequestMethod.ALL }); // Apply to all routes
  }
}
