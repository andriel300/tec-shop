import { Catch, RpcExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
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
export class AllExceptionsFilter implements RpcExceptionFilter<RpcException | HttpException> {
  catch(exception: RpcException | HttpException, _: ArgumentsHost): Observable<StructuredError> {
    let status: number;
    let message: string | object;
    let error: string;

    if (exception instanceof RpcException) {
      const errorResponse = exception.getError();
      if (typeof errorResponse === 'object' && errorResponse !== null && 'status' in errorResponse && 'message' in errorResponse) {
        // If the RpcException was created with a structured error object (e.g., from an HttpException)
        const typedError = errorResponse as ErrorResponse;
        status = typedError.status || HttpStatus.INTERNAL_SERVER_ERROR;
        message = typedError.message || 'Unknown error';
        error = typedError.error || 'RpcException';
      } else {
        // If RpcException was created with a simple string message
        status = HttpStatus.INTERNAL_SERVER_ERROR; // Default status for generic RpcException
        message = errorResponse as string;
        error = 'RpcException';
      }
    } else if (exception instanceof HttpException) {
      // Handle NestJS HttpExceptions
      status = exception.getStatus();
      message = exception.getResponse();
      error = exception.name;
    } else {
      // Handle any other unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'UnknownError';
    }

    // Log the error (you can use your pino logger here)
    console.error(`[RpcExceptionFilter] Status: ${status}, Message: ${JSON.stringify(message)}, Error: ${error}`);

    // Return a structured error object that the client can understand
    // The client (e.g., API Gateway) will receive this object
    return throwError((): StructuredError => ({
      status,
      message,
      error,
      timestamp: new Date().toISOString(),
    }));
  }
}
