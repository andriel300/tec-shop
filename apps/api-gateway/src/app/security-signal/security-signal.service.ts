import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { LogProducerService } from '@tec-shop/logger-producer';
import { LogCategory } from '@tec-shop/dto';
import { SecuritySignalType } from '@tec-shop/dto';

@Injectable()
export class SecuritySignalService {
  private readonly logger = new Logger(SecuritySignalService.name);

  constructor(private readonly logProducer: LogProducerService) {}

  async record(
    type: SecuritySignalType,
    ip: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    this.logger.warn(`[SECURITY SIGNAL] type=${type} ip=${ip}`);

    void this.logProducer.warn(
      'api-gateway',
      LogCategory.SECURITY,
      `Client security signal: ${type}`,
      { metadata: { ip, type, ...metadata } },
    );
  }

  extractIp(req: Request): string {
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }
}
