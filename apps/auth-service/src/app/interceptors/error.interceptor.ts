import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadGatewayException,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType();

    if (type === 'rpc') {
      return next.handle().pipe(
        catchError((err) => {
          // Log the error for debugging purposes
          console.error('Microservice Error:', err);

          // Transform the error into a standardized format for microservice clients
          // You can customize this based on your error handling strategy
          if (err instanceof HttpException) {
            // NestJS HTTP exceptions (e.g., BadRequestException, UnauthorizedException)
            return throwError(() => ({
              status: err.getStatus(),
              message: err.getResponse(),
              timestamp: new Date().toISOString(),
            }));
          } else if (err instanceof Error) {
            // Generic JavaScript errors
            return throwError(() => ({
              status: 500, // Internal Server Error
              message: err.message || 'Internal server error',
              timestamp: new Date().toISOString(),
            }));
          }
          // Fallback for unknown error types
          return throwError(() => ({
            status: 500,
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
          }));
        }),
      );
    }

    // For other types of contexts (e.g., HTTP), just pass through or handle differently
    return next.handle();
  }
}
