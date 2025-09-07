import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { Request } from 'express';

@ApiTags('Default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // This decorator provides a brief, human-readable description for this specific operation.
  // This summary is displayed next to the path in the Swagger UI, making the API's purpose clear.
  @ApiOperation({ summary: 'Get a welcome message' })
  getData() {
    return this.appService.getData();
  }

  @Get('csrf-token')
  @ApiOperation({ summary: 'Get CSRF token' })
  getCsrfToken(@Req() req: Request): { csrfToken: string } {
    // The csrf-csrf middleware attaches the token to req.csrfToken()
    // or req.doubleCsrfToken() depending on its configuration.
    // We'll check for both, as req.csrfToken() might be undefined if not explicitly set by the middleware.
    const csrfToken = (req as any).csrfToken
      ? (req as any).csrfToken()
      : (req as any).doubleCsrfToken();
    if (!csrfToken) {
      // This should ideally not happen if middleware is configured correctly
      throw new Error('CSRF token not available on request.');
    }
    return { csrfToken: csrfToken as string };
  }
}
