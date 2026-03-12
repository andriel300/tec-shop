import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram } from 'prom-client';
import type { Request, Response } from 'express';
import { trace } from '@opentelemetry/api';
import { metricsRegistry } from './metrics.registry.js';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
  enableExemplars: true,
});

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { route?: { path: string } }>();
    const res = context.switchToHttp().getResponse<Response>();

    const url = req.url ?? '';
    const isInfraRequest =
      url === '/metrics' ||
      url === '/api/metrics' ||
      url.startsWith('/health') ||
      url.startsWith('/api/health');

    if (isInfraRequest) {
      return next.handle();
    }

    const startMs = Date.now();
    return next.handle().pipe(
      tap(() => {
        const durationSeconds = (Date.now() - startMs) / 1000;
        const labels = {
          method: req.method,
          route: req.route?.path ?? req.url,
          status_code: String(res.statusCode),
        };

        const activeContext = trace.getActiveSpan()?.spanContext();
        if (activeContext) {
          httpRequestDuration.observeWithExemplar({
            labels,
            value: durationSeconds,
            exemplarLabels: {
              traceId: activeContext.traceId,
              spanId: activeContext.spanId,
            },
          });
        } else {
          httpRequestDuration.observeWithoutExemplar({
            labels,
            value: durationSeconds,
          });
        }
      }),
    );
  }
}
