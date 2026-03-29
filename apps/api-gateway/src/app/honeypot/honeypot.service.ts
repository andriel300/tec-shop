import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@tec-shop/redis-client';
import { LogProducerService } from '@tec-shop/logger-producer';
import { LogCategory } from '@tec-shop/dto';
import { HONEYPOT_BAN_TTL_SECONDS_DEFAULT } from './honeypot.config';

const BLOCKLIST_KEY_PREFIX = 'honeypot:blocked:';

@Injectable()
export class HoneypotService {
  private readonly logger = new Logger(HoneypotService.name);
  private readonly banTtlSeconds: number;

  constructor(
    private readonly redis: RedisService,
    private readonly logProducer: LogProducerService,
    config: ConfigService,
  ) {
    const raw = config.get<string>('HONEYPOT_BAN_TTL_SECONDS');
    this.banTtlSeconds = raw ? parseInt(raw, 10) : HONEYPOT_BAN_TTL_SECONDS_DEFAULT;
  }

  /**
   * Returns true when the IP is currently in the Redis blocklist.
   * Called by BlocklistGuard on every incoming request.
   */
  async isBlocked(ip: string): Promise<boolean> {
    const exists = await this.redis.exists(`${BLOCKLIST_KEY_PREFIX}${ip}`);
    return exists > 0;
  }

  /**
   * Records a honeypot hit:
   *  1. Adds the IP to the Redis blocklist with a TTL.
   *  2. Emits a SECURITY-level log event to Kafka for Grafana visibility.
   *  3. Logs a local warning so it appears in pino/stdout immediately.
   */
  async recordHit(
    ip: string,
    path: string,
    method: string,
    userAgent: string,
  ): Promise<void> {
    await this.redis.set(
      `${BLOCKLIST_KEY_PREFIX}${ip}`,
      '1',
      this.banTtlSeconds,
    );

    this.logger.warn(
      `[HONEYPOT] ${method} ${path} from ${ip} — IP banned for ${this.banTtlSeconds}s`,
    );

    // Fire-and-forget: emit to Kafka; failures are caught internally by LogProducerService
    void this.logProducer.warn('api-gateway', LogCategory.SECURITY, 'Honeypot triggered', {
      metadata: { ip, path, method, userAgent, banTtlSeconds: this.banTtlSeconds },
    });
  }

  /**
   * Manually unblocks an IP (admin use / testing).
   */
  async unblock(ip: string): Promise<void> {
    await this.redis.del(`${BLOCKLIST_KEY_PREFIX}${ip}`);
    this.logger.log(`[HONEYPOT] IP ${ip} manually unblocked`);
  }

  /**
   * Returns remaining ban TTL in seconds, or -2 if not blocked.
   */
  async remainingBanTtl(ip: string): Promise<number> {
    return this.redis.ttl(`${BLOCKLIST_KEY_PREFIX}${ip}`);
  }
}
