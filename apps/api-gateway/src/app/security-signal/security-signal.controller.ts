import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { SecuritySignalDto } from '@tec-shop/dto';
import { SecuritySignalService } from './security-signal.service';

@ApiTags('Security')
@Controller('security')
export class SecuritySignalController {
  constructor(private readonly securitySignal: SecuritySignalService) {}

  /**
   * Receives client-side security signals (DevTools open, bot detection) and
   * forwards them to the Kafka SECURITY log topic for Grafana visibility.
   *
   * No auth required — signals may originate from unauthenticated pages (login).
   * Server-side IP extraction prevents spoofing via request body.
   */
  @Post('signal')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Report a client-side security signal' })
  async handleSignal(
    @Body() dto: SecuritySignalDto,
    @Req() req: Request,
  ): Promise<void> {
    const ip = this.securitySignal.extractIp(req);
    await this.securitySignal.record(dto.type, ip, dto.metadata);
  }
}
