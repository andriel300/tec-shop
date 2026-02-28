import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'nestjs-pino'; // Assuming nestjs-pino for integration

@Injectable()
export class LoggingInterceptor implements NestInterceptor<unknown, unknown> {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const type = context.getType(); // 'rpc' for microservices

    if (type === 'rpc') {
      const rpcContext = context.switchToRpc();
      const data = rpcContext.getData(); // The payload sent to the microservice
      const pattern = rpcContext.getContext().getPattern(); // The message pattern

      this.logger.log(`[${pattern}] Incoming RPC Request: ${JSON.stringify(data)}`);

      return next.handle().pipe(
        tap(
          (response) => {
            this.logger.log(
              `[${pattern}] Outgoing RPC Response: ${JSON.stringify(response)} - ${Date.now() - now}ms`
            );
          },
          (err: Error) => {
            this.logger.error(
              `[${pattern}] RPC Error: ${err.message} - ${Date.now() - now}ms`
            );
          }
        )
      );
    }

    // For other types of contexts (e.g., HTTP), just pass through
    return next.handle();
  }
}
