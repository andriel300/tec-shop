import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AllExceptionsFilter } from '@tec-shop/exceptions';
import { LoggerMiddleware } from '@tec-shop/middleware';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    HttpModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // This special token tells Nest to register this guard as a global
      // security layer, meaning it will automatically protect all routes
      // in the application without needing to add it to each controller.
      provide: APP_GUARD, // This is the key that tells NestJS to apply it globally
      useClass: ThrottlerGuard,
    },
    {
      // By binding this filter globally, we ensure every unhandled error
      // across the entire app gets processed into a consistent, friendly
      // JSON response format before it's sent back to the client.
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    }
  ],
})

export class AppModule implements NestModule {
  // This is where we hook into Nest's request lifecycle and apply
  // middleware that runs before any route handler is executed.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) // Applies our custom logging to every single incoming request
      .forRoutes('*path');         // The asterisk wildcard means "for all routes without exception"
  }
}
