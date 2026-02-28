import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { Response } from 'express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import type {
  LogQueryDto,
  LogDownloadQueryDto,
  LogListResponseDto,
  LogStatsDto,
} from '@tec-shop/dto';

@ApiTags('Logs')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class LoggerController {
  private readonly logger = new Logger(LoggerController.name);

  constructor(
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: ClientProxy
  ) {}

  @Get()
  @ApiOperation({ summary: 'Query logs with filters and pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @ApiQuery({ name: 'service', required: false, type: String })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: ['debug', 'info', 'warn', 'error', 'fatal'],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: [
      'auth',
      'user',
      'seller',
      'product',
      'order',
      'system',
      'security',
      'payment',
    ],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async queryLogs(@Query() query: LogQueryDto): Promise<LogListResponseDto> {
    this.logger.log(`Querying logs with filters: ${JSON.stringify(query)}`);
    return await firstValueFrom(
      this.loggerService.send('logger.query', query)
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get log statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Log statistics retrieved successfully' })
  async getStats(): Promise<LogStatsDto> {
    this.logger.log('Fetching log statistics');
    return await firstValueFrom(this.loggerService.send('logger.stats', {}));
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent logs from cache (Admin only)' })
  @ApiResponse({ status: 200, description: 'Recent logs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentLogs(@Query('limit') limit?: number) {
    this.logger.log(`Fetching recent logs, limit: ${limit || 50}`);
    return await firstValueFrom(
      this.loggerService.send('logger.recent', { limit: limit || 50 })
    );
  }

  @Get('download')
  @ApiOperation({ summary: 'Download logs as text file (Admin only)' })
  @ApiResponse({ status: 200, description: 'Logs downloaded successfully' })
  @ApiQuery({ name: 'service', required: false, type: String })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: ['debug', 'info', 'warn', 'error', 'fatal'],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: [
      'auth',
      'user',
      'seller',
      'product',
      'order',
      'system',
      'security',
      'payment',
    ],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async downloadLogs(
    @Query() query: LogDownloadQueryDto,
    @Res() res: Response
  ) {
    this.logger.log(`Downloading logs with filters: ${JSON.stringify(query)}`);

    const content = await firstValueFrom(
      this.loggerService.send('logger.download', query)
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs-${timestamp}.txt`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get list of services that have logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Services list retrieved successfully' })
  async getServices() {
    this.logger.log('Fetching services list');
    return await firstValueFrom(
      this.loggerService.send('logger.services', {})
    );
  }
}
