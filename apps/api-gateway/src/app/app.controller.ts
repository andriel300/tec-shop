import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API Health Check',
    description:
      'Returns the health status of the API Gateway. Use this endpoint to verify that the service is running and responsive.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy and operational',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hello API',
          description: 'Confirmation message from the API Gateway',
        },
      },
    },
  })
  getData() {
    return this.appService.getData();
  }
}
