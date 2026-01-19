import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

const ONLINE_USER_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class OnlineRedisService {
  private readonly logger = new Logger(OnlineRedisService.name);

  constructor(private readonly redis: RedisService) {}

  private getOnlineUserKey(userId: string): string {
    return `online:user:${userId}`;
  }

  async setUserOnline(userId: string, socketId: string): Promise<void> {
    const key = this.getOnlineUserKey(userId);
    await this.redis.set(key, socketId, ONLINE_USER_TTL_SECONDS);
  }

  async setUserOffline(userId: string): Promise<void> {
    const key = this.getOnlineUserKey(userId);
    await this.redis.del(key);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = this.getOnlineUserKey(userId);
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async refreshUserOnline(userId: string): Promise<void> {
    const key = this.getOnlineUserKey(userId);
    const ttl = await this.redis.ttl(key);
    if (ttl > 0) {
      await this.redis.expire(key, ONLINE_USER_TTL_SECONDS);
    }
  }

  async getSocketIdForUser(userId: string): Promise<string | null> {
    const key = this.getOnlineUserKey(userId);
    return this.redis.get(key);
  }
}
