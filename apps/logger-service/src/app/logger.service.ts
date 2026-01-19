import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  @MessagePattern('logger.write')
  handleLog(@Payload() data: any) {
    // Basic distributed logging microservice
    this.logger.log(`Remote log entry: ${JSON.stringify(data)}`);

    // TODO: store logs, send to S3, database, etc.
    return { status: 'written' };
  }

  @MessagePattern('logger.health')
  healthCheck() {
    return { ok: true, timestamp: Date.now() };
  }
}
