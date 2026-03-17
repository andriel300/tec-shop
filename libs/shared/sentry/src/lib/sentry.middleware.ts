import { Injectable, NestMiddleware } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';
import * as Sentry from '@sentry/nestjs';

/**
 * HTTP middleware that stamps each request's Sentry scope with request-level
 * metadata (method, URL, IP) before the request reaches any guard or handler.
 *
 * Apply in AppModule.configure():
 *   consumer.apply(SentryContextMiddleware).forRoutes('*');
 *
 * Note: req.user is NOT available here — use SentryInterceptor for user context
 * (interceptors run after guards).
 */
@Injectable()
export class SentryContextMiddleware implements NestMiddleware {
  use(
    req: IncomingMessage & { url?: string; method?: string },
    _res: ServerResponse,
    next: () => void,
  ): void {
    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
      ip: req.socket?.remoteAddress,
    });

    next();
  }
}
