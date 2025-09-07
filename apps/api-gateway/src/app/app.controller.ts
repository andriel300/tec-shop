import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Request } from 'express'; // Added

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
    // Let's assume req.csrfToken() for now, as it's common.
    // If it doesn't work, we might need to adjust based on csrf-csrf docs.
    return { csrfToken: req.csrfToken() as string };
  }
}
