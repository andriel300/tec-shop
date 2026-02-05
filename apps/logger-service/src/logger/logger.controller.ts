import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoggerCoreService } from './logger-core.service';
import type {
  LogQueryDto,
  LogDownloadQueryDto,
  LogEntryResponseDto,
  LogListResponseDto,
  LogStatsDto,
} from '@tec-shop/dto';

@Controller()
export class LoggerTcpController {
  private readonly logger = new Logger(LoggerTcpController.name);

  constructor(private readonly loggerCore: LoggerCoreService) {}

  @MessagePattern('logger.query')
  async queryLogs(@Payload() query: LogQueryDto): Promise<LogListResponseDto> {
    this.logger.log(`Querying logs: ${JSON.stringify(query)}`);
    return this.loggerCore.queryLogs(query);
  }

  @MessagePattern('logger.stats')
  async getStats(): Promise<LogStatsDto> {
    this.logger.log('Fetching log statistics');
    return this.loggerCore.getStats();
  }

  @MessagePattern('logger.recent')
  async getRecentLogs(
    @Payload() data: { limit?: number }
  ): Promise<LogEntryResponseDto[]> {
    this.logger.log(`Fetching recent logs, limit: ${data.limit || 50}`);
    return this.loggerCore.getRecentLogs(data.limit);
  }

  @MessagePattern('logger.download')
  async downloadLogs(@Payload() query: LogDownloadQueryDto): Promise<string> {
    this.logger.log(`Downloading logs: ${JSON.stringify(query)}`);
    return this.loggerCore.downloadLogs(query);
  }

  @MessagePattern('logger.services')
  async getServices(): Promise<{ services: string[] }> {
    this.logger.log('Fetching services list');
    const stats = await this.loggerCore.getStats();
    return { services: Object.keys(stats.byService) };
  }
}
