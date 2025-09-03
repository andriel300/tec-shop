import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// This decorator tells Nest to use this filter to catch EVERYTHING.
// It's our application's ultimate safety net for any unhandled error.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // For the client response, we still want a sanitized message
    const clientMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // For logging, we want the REAL error. We log the message and the stack trace.
    this.logger.error(
      `Error on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: clientMessage, // Send the sanitized message to the client
    });
  }
}
