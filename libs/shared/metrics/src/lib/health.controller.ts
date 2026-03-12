import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import type { HealthIndicatorFunction } from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    @Inject('HEALTH_INDICATORS')
    @Optional()
    private readonly indicators: HealthIndicatorFunction[] = [],
  ) {}

  @Get('/health')
  @HealthCheck()
  check() {
    return this.health.check(this.indicators ?? []);
  }
}
