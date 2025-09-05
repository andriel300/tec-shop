import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Using a single URL is preferred for services like Upstash
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set.');
    }
    this.client = new Redis(redisUrl);

    this.client.on('connect', () => console.log('Connected to Redis'));
    this.client.on('error', (err) =>
      console.error('Redis connection error', err)
    );
  }

  onModuleDestroy() {
    this.client.quit();
  }

  async set(key: string, value: string, expirySeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', expirySeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
