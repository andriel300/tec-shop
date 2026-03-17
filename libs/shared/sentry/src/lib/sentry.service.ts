import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

/**
 * Injectable wrapper around the Sentry SDK.
 * Provides typed helpers for common capture operations so services
 * never import @sentry/nestjs directly.
 */
@Injectable()
export class SentryService {
  captureException(exception: unknown, extras?: Record<string, unknown>): void {
    if (extras) {
      Sentry.withScope((scope) => {
        scope.setContext('extras', extras);
        Sentry.captureException(exception);
      });
    } else {
      Sentry.captureException(exception);
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
  }

  setUser(user: Sentry.User | null): void {
    Sentry.setUser(user);
  }

  clearUser(): void {
    Sentry.setUser(null);
  }

  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  setContext(name: string, context: Record<string, unknown>): void {
    Sentry.setContext(name, context);
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    Sentry.addBreadcrumb(breadcrumb);
  }

  withScope<T>(callback: (scope: Sentry.Scope) => T): T {
    return Sentry.withScope(callback);
  }
}
