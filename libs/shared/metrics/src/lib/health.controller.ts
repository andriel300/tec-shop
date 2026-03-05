import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('/health')
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
