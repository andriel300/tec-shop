import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import { MessageRedisService } from './message.redis.service';
import { OnlineRedisService } from './online.redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL environment variable not set');
        }
        return new Redis(redisUrl);
      },
      inject: [ConfigService],
    },
    RedisService,
    MessageRedisService,
    OnlineRedisService,
  ],
  exports: [RedisService, MessageRedisService, OnlineRedisService],
})
export class RedisModule {}
