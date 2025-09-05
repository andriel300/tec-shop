import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter, LoggerMiddleware } from '@tec-shop/common'
import { AuthController } from './auth.controller';

@Module({
  imports: [
    // Sets up a global rate limiter to protect against brute-force attacks
    // and API abuse. This configuration allows a maximum of 10 requests
    // from a single IP address per minute (60,000 milliseconds).
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }])
  ],
  controllers: [AppController, AuthController],
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
