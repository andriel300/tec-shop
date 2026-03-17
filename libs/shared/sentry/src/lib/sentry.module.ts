import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryService } from './sentry.service.js';
import { SentryExceptionFilter } from './sentry.filter.js';
import type { SentryTransport } from './sentry-init.js';

export interface SentryModuleOptions {
  serviceName: string;
  transport?: SentryTransport;
  port?: string | number;
}

export const SENTRY_MODULE_OPTIONS = 'SENTRY_MODULE_OPTIONS';

/**
 * Global NestJS module for Sentry integration.
 *
 * Provides:
 *  - SentryService  — injectable SDK wrapper (available across the whole app)
 *  - SentryExceptionFilter — global APP_FILTER that captures 5xx errors and
 *    handles responses for HTTP and RPC contexts
 *
 * Usage in AppModule:
 *   imports: [SentryModule.forRoot({ serviceName: 'auth-service', transport: 'TCP' })]
 *
 * For HTTP services, also apply SentryContextMiddleware and SentryInterceptor:
 *   - consumer.apply(SentryContextMiddleware).forRoutes('*') in configure()
 *   - { provide: APP_INTERCEPTOR, useClass: SentryInterceptor } in providers
 */
@Global()
@Module({})
export class SentryModule {
  static forRoot(options: SentryModuleOptions): DynamicModule {
    return {
      global: true,
      module: SentryModule,
      providers: [
        { provide: SENTRY_MODULE_OPTIONS, useValue: options },
        SentryService,
        { provide: APP_FILTER, useClass: SentryExceptionFilter },
      ],
      exports: [SentryService],
    };
  }
}
