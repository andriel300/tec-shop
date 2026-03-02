import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const contextType = context.getType();
    const startTime = Date.now();

    if (contextType === 'rpc') {
      const rpcContext = context.switchToRpc();
      const pattern = rpcContext.getContext()?.args?.[1] ?? 'unknown';
      this.logger.log(`[RPC] Incoming: ${JSON.stringify(pattern)}`);

      return next.handle().pipe(
        tap({
          next: () => {
            const duration = Date.now() - startTime;
            this.logger.log(
              `[RPC] Completed: ${JSON.stringify(pattern)} +${duration}ms`,
            );
          },
          error: (err: unknown) => {
            const duration = Date.now() - startTime;
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(
              `[RPC] Failed: ${JSON.stringify(pattern)} +${duration}ms - ${message}`,
            );
          },
        }),
      );
    }

    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest<{
        method: string;
        url: string;
      }>();
      const { method, url } = request;
      this.logger.log(`[HTTP] ${method} ${url}`);

      return next.handle().pipe(
        tap({
          next: () => {
            const duration = Date.now() - startTime;
            this.logger.log(
              `[HTTP] ${method} ${url} - ${duration}ms`,
            );
          },
          error: (err: unknown) => {
            const duration = Date.now() - startTime;
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(
              `[HTTP] ${method} ${url} - ${duration}ms - ${message}`,
            );
          },
        }),
      );
    }

    return next.handle();
  }
}
