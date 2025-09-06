import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

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
}
