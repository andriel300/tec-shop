import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface RpcError {
  statusCode?: number;
  status?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Global filter that catches errors propagated from TCP microservices via firstValueFrom().
 * When a microservice throws HttpException (e.g. UnauthorizedException),
 * NestJS TCP transport serializes it as { statusCode, message, error }.
 * Without this filter, the gateway treats it as an unhandled error and returns 500.
 */
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Let NestJS HTTP exceptions pass through with their own status
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return response.status(status).json(body);
    }

    // Handle microservice RPC errors: { statusCode, message, error }
    const rpcError = exception as RpcError;
    const status = rpcError?.statusCode ?? rpcError?.status;

    if (status && status >= 100 && status < 600) {
      const message = Array.isArray(rpcError.message)
        ? rpcError.message.join(', ')
        : rpcError.message ?? HttpStatus[status] ?? 'Error';

      return response.status(status).json({
        statusCode: status,
        message,
        error: rpcError.error ?? '',
      });
    }

    // Unknown error — log it and return 500
    this.logger.error('Unhandled exception', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
