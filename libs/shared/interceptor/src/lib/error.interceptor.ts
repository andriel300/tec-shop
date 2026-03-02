import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
  traceId?: string;
}

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptor.name);

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((err: unknown) => {
        if (err instanceof RpcException) {
          return throwError(() => err);
        }

        const message =
          err instanceof Error ? err.message : 'Internal server error';
        const status =
          (err as { status?: number })?.status ?? 500;

        this.logger.error(`Unhandled error: ${message}`, err instanceof Error ? err.stack : undefined);

        const errorResponse: ErrorResponse = {
          status,
          message,
          timestamp: new Date().toISOString(),
        };

        return throwError(() => new RpcException(errorResponse));
      }),
    );
  }
}
