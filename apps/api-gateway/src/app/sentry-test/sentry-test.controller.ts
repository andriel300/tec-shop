import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';

@ApiTags('Sentry Test')
@Controller('sentry-test')
export class SentryTestController {
  @Get('error')
  @ApiOperation({
    summary: 'Trigger a test error for Sentry',
    description: 'This endpoint intentionally throws an error to test Sentry error tracking. Use this to verify that errors are being captured and sent to Sentry.'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error (intentional for testing)'
  })
  triggerError() {
    throw new InternalServerErrorException(
      'This is a test error for Sentry - API Gateway'
    );
  }

  @Get('custom-error')
  @ApiOperation({
    summary: 'Trigger a custom error with context',
    description: 'Throws an error with additional context metadata for Sentry'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error with custom context'
  })
  triggerCustomError() {
    // Add custom context to the error
    Sentry.setTag('test_type', 'custom');
    Sentry.setContext('test_context', {
      userId: 'test-user-123',
      action: 'custom_error_test',
      timestamp: new Date().toISOString(),
    });

    throw new Error('Custom test error with additional context');
  }

  @Get('capture-message')
  @ApiOperation({
    summary: 'Capture a test message (not an error)',
    description: 'Sends a non-error message to Sentry for testing message capture'
  })
  @ApiResponse({
    status: 200,
    description: 'Message captured successfully'
  })
  captureMessage() {
    Sentry.captureMessage('Test message from API Gateway', 'info');
    return {
      message: 'Test message sent to Sentry',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns OK status - should not trigger Sentry errors'
  })
  @ApiResponse({
    status: 200,
    description: 'API Gateway is healthy'
  })
  healthCheck() {
    return {
      status: 'ok',
      service: 'api-gateway',
      sentry: 'configured',
      timestamp: new Date().toISOString(),
    };
  }
}
