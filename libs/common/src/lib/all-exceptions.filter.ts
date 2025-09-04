import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

// By extending the base filter, this becomes the application's ultimate
// safety net for any unhandled error. The @Catch() decorator is no longer needed.
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor() {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let clientMessage: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      clientMessage = exception.getResponse();
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      clientMessage = 'Invalid data provided to the database.';
      this.logger.warn(
        `Prisma Validation Error on ${request.method} ${request.url}: ${exception.message}`,
      );
    } else if (exception instanceof Error) {
      // Generic error handling for other Error types
      clientMessage = exception.message;
    }

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
