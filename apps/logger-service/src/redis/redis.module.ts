import { Module } from '@nestjs/common';
import { RedisModule as SharedRedisModule } from '@tec-shop/redis-client';
import { RedisService } from './redis.service';

@Module({
  imports: [SharedRedisModule.forRoot()],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
