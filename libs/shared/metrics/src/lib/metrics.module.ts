import { Module, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics } from 'prom-client';
import { MetricsController } from './metrics.controller.js';

@Module({ controllers: [MetricsController] })
export class MetricsModule implements OnModuleInit {
  onModuleInit() {
    collectDefaultMetrics();
  }
}
