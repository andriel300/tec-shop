import { Module } from '@nestjs/common';
import { RedisModule as SharedRedisModule } from '@tec-shop/redis-client';
import { RedisService } from './redis.service';
import { MessageRedisService } from './message.redis.service';
import { OnlineRedisService } from './online.redis.service';

@Module({
  imports: [SharedRedisModule.forRoot()],
  providers: [RedisService, MessageRedisService, OnlineRedisService],
  exports: ['REDIS_CLIENT', RedisService, MessageRedisService, OnlineRedisService],
})
export class RedisModule {}
