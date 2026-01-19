import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  private prefix(key: string): string {
    return `chatting:${key}`;
  }

  async set(
    key: string,
    value: string,
    expireInSeconds?: number
  ): Promise<void> {
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

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(this.prefix(pattern));
  }

  async exists(key: string): Promise<number> {
    return this.redisClient.exists(this.prefix(key));
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.incr(this.prefix(key));
  }

  async decr(key: string): Promise<number> {
    return this.redisClient.decr(this.prefix(key));
  }

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(this.prefix(key));
  }

  // JSON helpers
  async setJson(
    key: string,
    value: unknown,
    expireInSeconds?: number
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), expireInSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async lpush(key: string, value: string): Promise<number> {
    return this.redisClient.lpush(this.prefix(key), value);
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    return this.redisClient.ltrim(this.prefix(key), start, stop);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redisClient.expire(this.prefix(key), seconds);
  }
}
