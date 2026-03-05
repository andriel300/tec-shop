import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram } from 'prom-client';
import type { Request, Response } from 'express';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { route?: { path: string } }>();
    const res = context.switchToHttp().getResponse<Response>();
    const end = httpRequestDuration.startTimer();
    return next.handle().pipe(
      tap(() =>
        end({
          method: req.method,
          route: req.route?.path ?? req.url,
          status_code: res.statusCode,
        }),
      ),
    );
  }
}
