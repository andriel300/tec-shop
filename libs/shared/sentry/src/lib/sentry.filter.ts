import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import * as Sentry from '@sentry/nestjs';

interface RpcErrorShape {
  status?: number;
  message?: string | object;
  error?: string;
}

interface RpcErrorPayload {
  status: number;
  message: string | object;
  error: string;
  timestamp: string;
}

/**
 * Global exception filter that:
 *  1. Captures server errors (5xx) to Sentry — skips 4xx client mistakes.
 *  2. Returns a structured response for HTTP context.
 *  3. Returns throwError() for RPC/TCP context (matches AllExceptionsFilter contract).
 *
 * Register via SentryModule.forRoot() as APP_FILTER.
 * WS exceptions are handled separately by WsExceptionFilter on each gateway.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): void | Observable<RpcErrorPayload> {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Only report genuine server errors — 4xx are client mistakes, not bugs.
    if (status >= 500) {
      Sentry.captureException(exception);
    }

    const contextType = host.getType<'http' | 'rpc' | 'ws'>();

    if (contextType === 'http') {
      return this.handleHttp(exception, host, status);
    }

    if (contextType === 'rpc') {
      return this.handleRpc(exception, status);
    }

    // WS context — should be caught by WsExceptionFilter first
    this.logger.error(
      `SentryExceptionFilter reached for unhandled context "${contextType}"`,
    );
  }

  private handleHttp(
    exception: unknown,
    host: ArgumentsHost,
    status: number,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(`[HTTP] ${status}: ${JSON.stringify(message)}`);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private handleRpc(
    exception: unknown,
    status: number,
  ): Observable<RpcErrorPayload> {
    let message: string | object = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof RpcException) {
      const err = exception.getError();
      if (typeof err === 'object' && err !== null) {
        const e = err as RpcErrorShape;
        message = e.message ?? 'Unknown error';
        error = e.error ?? 'RpcException';
      } else {
        message = String(err);
        error = 'RpcException';
      }
    } else if (exception instanceof HttpException) {
      message = exception.getResponse();
      error = exception.name;
    }

    this.logger.error(`[RPC] ${status}: ${JSON.stringify(message)}`);

    return throwError(
      (): RpcErrorPayload => ({
        status,
        message,
        error,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
