import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

interface StructuredError {
  status: number;
  message: string | object;
  error: string;
  timestamp: string;
}

interface ErrorResponse {
  status?: number;
  message?: string | object;
  error?: string;
}

@Catch(RpcException, HttpException)
export class AllExceptionsFilter
  implements RpcExceptionFilter<RpcException | HttpException>
{
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(
    exception: RpcException | HttpException,
    _host: ArgumentsHost,
  ): Observable<StructuredError> {
    let status: number;
    let message: string | object;
    let error: string;

    if (exception instanceof RpcException) {
      const errorResponse = exception.getError();
      if (
        typeof errorResponse === 'object' &&
        errorResponse !== null &&
        'status' in errorResponse &&
        'message' in errorResponse
      ) {
        const typedError = errorResponse as ErrorResponse;
        status = typedError.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
        message = typedError.message ?? 'Unknown error';
        error = typedError.error ?? 'RpcException';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = errorResponse as string;
        error = 'RpcException';
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
      error = exception.name;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'UnknownError';
    }

    this.logger.error(
      `[RpcExceptionFilter] Status: ${status}, Message: ${JSON.stringify(message)}, Error: ${error}`,
    );

    return throwError(
      (): StructuredError => ({
        status,
        message,
        error,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
