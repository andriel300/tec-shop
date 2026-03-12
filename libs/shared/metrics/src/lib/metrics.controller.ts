import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { metricsRegistry } from './metrics.registry.js';

@Controller()
export class MetricsController {
  @Get('/metrics')
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  }
}
