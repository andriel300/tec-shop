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
    // Gets the underlying HTTP context (request/response objects) from the host.
    // This is like getting the details of the current phone call.
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Figures out the correct HTTP status code.
    // If it's a known HttpException (like a 404), we use its code.
    // If it's something completely unexpected (like a database disconnect),
    // we default to a generic 500 Internal Server Error.
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Safely extracts the error message. HttpExceptions can have complex
    // response objects, so we use getResponse(). For anything else, we use
    // a generic message to avoid leaking sensitive internal error details.
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // This is crucial for debugging. We log the error with its context
    // (method, URL, message) so we know what went wrong and where,
    // but we send a sanitized response back to the client.
    this.logger.error(`Error on ${request.method} ${request.url}: ${JSON.stringify(message)}`);

    // Sends a consistent, structured JSON error response back to the client.
    // This is important because even our errors have a predictable format.
    response.status(status).json({
      statusCode: status,  // The HTTP status code (e.g., 404, 500)
      timestamp: new Date().toISOString(), // When the error happened
      path: request.url,   // The endpoint that caused the error
      message,             // A description of what went wrong
    });
  }
}
