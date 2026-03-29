import { Module } from '@nestjs/common';
import { RedisModule } from '@tec-shop/redis-client';
import { HoneypotService } from './honeypot.service';
import { HoneypotMiddleware } from './honeypot.middleware';
import { BlocklistGuard } from './honeypot.guard';

// LogProducerModule is @Global() — LogProducerService is injectable without re-importing the module.

@Module({
  imports: [RedisModule.forRoot()],
  providers: [HoneypotService, HoneypotMiddleware, BlocklistGuard],
  exports: [HoneypotService, BlocklistGuard],
})
export class HoneypotModule {}
