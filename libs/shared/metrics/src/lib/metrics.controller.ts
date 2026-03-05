import { Controller, Get, Header, Res } from '@nestjs/common';
import { register } from 'prom-client';
import type { Response } from 'express';

@Controller()
export class MetricsController {
  @Get('/metrics')
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
