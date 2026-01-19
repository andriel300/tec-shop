import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class MessageRedisService {
  private readonly logger = new Logger(MessageRedisService.name);

  constructor(private readonly redis: RedisService) {}

  private getUnseenCountKey(userId: string, conversationId: string): string {
    return `unseen-count:${userId}:${conversationId}`;
  }

  async incrementUnseenCount(
    userId: string,
    conversationId: string,
  ): Promise<number> {
    const key = this.getUnseenCountKey(userId, conversationId);
    return this.redis.incr(key);
  }

  async clearUnseenCount(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const key = this.getUnseenCountKey(userId, conversationId);
    await this.redis.del(key);
  }

  async getUnseenCount(
    userId: string,
    conversationId: string,
  ): Promise<number> {
    const key = this.getUnseenCountKey(userId, conversationId);
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async getUnseenCounts(
    userId: string,
  ): Promise<Record<string, number>> {
    const pattern = `unseen-count:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    const counts: Record<string, number> = {};

    if (keys.length === 0) {
      return counts;
    }

    const values = await Promise.all(keys.map((key) => this.redis.get(key)));

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const conversationId = key.split(':')[2];
      const count = values[i];
      if (conversationId && count) {
        counts[conversationId] = parseInt(count, 10);
      }
    }

    return counts;
  }
}
