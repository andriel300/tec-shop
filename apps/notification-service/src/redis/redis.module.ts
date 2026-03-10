import { Module } from '@nestjs/common';
import { RedisModule as SharedRedisModule } from '@tec-shop/redis-client';
import { RedisService } from './redis.service';

@Module({
  imports: [SharedRedisModule.forRoot()],
  providers: [RedisService],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
