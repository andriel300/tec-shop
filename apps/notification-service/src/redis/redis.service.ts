import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  private prefix(key: string): string {
    return `notification:${key}`;
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    key = this.prefix(key);
    if (expireInSeconds)
      await this.redisClient.set(key, value, 'EX', expireInSeconds);
    else await this.redisClient.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(this.prefix(key));
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(this.prefix(key));
  }

  async exists(key: string): Promise<number> {
    return this.redisClient.exists(this.prefix(key));
  }
}
