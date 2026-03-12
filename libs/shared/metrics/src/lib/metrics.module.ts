import { Module, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics } from 'prom-client';
import { MetricsController } from './metrics.controller.js';
import { metricsRegistry } from './metrics.registry.js';

@Module({ controllers: [MetricsController] })
export class MetricsModule implements OnModuleInit {
  onModuleInit() {
    collectDefaultMetrics({ register: metricsRegistry });
  }
}
