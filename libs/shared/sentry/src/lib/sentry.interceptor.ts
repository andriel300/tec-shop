import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as Sentry from '@sentry/nestjs';

interface AuthenticatedRequest {
  method: string;
  url: string;
  ip?: string;
  user?: {
    userId?: string;
    username?: string;
    userType?: string;
  };
}

/**
 * Sets Sentry user context and adds a request breadcrumb on every HTTP call.
 * Runs after guards, so req.user is available for authenticated routes.
 *
 * Register as APP_INTERCEPTOR in SentryModule or per-controller with @UseInterceptors().
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (req.user?.userId) {
      Sentry.setUser({
        id: req.user.userId,
        username: req.user.username,
        ...(req.user.userType && { userType: req.user.userType }),
      });
    }

    Sentry.addBreadcrumb({
      type: 'http',
      category: 'request',
      data: { method: req.method, url: req.url },
      level: 'info',
    });

    return next.handle();
  }
}
