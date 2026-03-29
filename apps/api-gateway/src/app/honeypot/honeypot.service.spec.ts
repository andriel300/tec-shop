import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HoneypotService } from './honeypot.service';
import { HONEYPOT_BAN_TTL_SECONDS_DEFAULT } from './honeypot.config';
import { RedisService } from '@tec-shop/redis-client';
import { LogProducerService } from '@tec-shop/logger-producer';

describe('HoneypotService', () => {
  let service: HoneypotService;
  let redis: jest.Mocked<RedisService>;
  let logProducer: jest.Mocked<LogProducerService>;

  const makeModule = async (banTtlEnvValue?: string) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HoneypotService,
        {
          provide: RedisService,
          useValue: {
            set: jest.fn().mockResolvedValue(undefined),
            exists: jest.fn().mockResolvedValue(0),
            del: jest.fn().mockResolvedValue(1),
            ttl: jest.fn().mockResolvedValue(3600),
          },
        },
        {
          provide: LogProducerService,
          useValue: {
            warn: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(banTtlEnvValue),
          },
        },
      ],
    }).compile();

    return {
      service: module.get<HoneypotService>(HoneypotService),
      redis: module.get<jest.Mocked<RedisService>>(RedisService),
      logProducer: module.get<jest.Mocked<LogProducerService>>(LogProducerService),
    };
  };

  beforeEach(async () => {
    const result = await makeModule(undefined);
    service = result.service;
    redis = result.redis;
    logProducer = result.logProducer;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Constructor / TTL config ──────────────────────────────────────────────

  describe('constructor — ban TTL configuration', () => {
    it('uses the default TTL when HONEYPOT_BAN_TTL_SECONDS is not set', async () => {
      const { service: svc, redis: r } = await makeModule(undefined);
      r.set.mockResolvedValue(undefined);
      await svc.recordHit('1.2.3.4', '/.env', 'GET', 'curl');
      expect(r.set).toHaveBeenCalledWith(
        'honeypot:blocked:1.2.3.4',
        '1',
        HONEYPOT_BAN_TTL_SECONDS_DEFAULT,
      );
    });

    it('uses env value when it is a valid positive integer', async () => {
      const { service: svc, redis: r } = await makeModule('7200');
      r.set.mockResolvedValue(undefined);
      await svc.recordHit('1.2.3.4', '/.env', 'GET', 'curl');
      expect(r.set).toHaveBeenCalledWith(
        'honeypot:blocked:1.2.3.4',
        '1',
        7200,
      );
    });

    it('falls back to default when env value is NaN', async () => {
      const { service: svc, redis: r } = await makeModule('not-a-number');
      r.set.mockResolvedValue(undefined);
      await svc.recordHit('1.2.3.4', '/.env', 'GET', 'curl');
      expect(r.set).toHaveBeenCalledWith(
        'honeypot:blocked:1.2.3.4',
        '1',
        HONEYPOT_BAN_TTL_SECONDS_DEFAULT,
      );
    });

    it('falls back to default when env value is zero', async () => {
      const { service: svc, redis: r } = await makeModule('0');
      r.set.mockResolvedValue(undefined);
      await svc.recordHit('1.2.3.4', '/.env', 'GET', 'curl');
      expect(r.set).toHaveBeenCalledWith(
        'honeypot:blocked:1.2.3.4',
        '1',
        HONEYPOT_BAN_TTL_SECONDS_DEFAULT,
      );
    });

    it('falls back to default when env value is negative', async () => {
      const { service: svc, redis: r } = await makeModule('-100');
      r.set.mockResolvedValue(undefined);
      await svc.recordHit('1.2.3.4', '/.env', 'GET', 'curl');
      expect(r.set).toHaveBeenCalledWith(
        'honeypot:blocked:1.2.3.4',
        '1',
        HONEYPOT_BAN_TTL_SECONDS_DEFAULT,
      );
    });

    it('falls back to default when env value is Infinity (non-finite)', async () => {
      const { service: svc, redis: r } = await makeModule('Infinity');
      r.set.mockResolvedValue(undefined);
      await svc.recordHit('1.2.3.4', '/.env', 'GET', 'curl');
      expect(r.set).toHaveBeenCalledWith(
        'honeypot:blocked:1.2.3.4',
        '1',
        HONEYPOT_BAN_TTL_SECONDS_DEFAULT,
      );
    });
  });

  // ─── isBlocked ─────────────────────────────────────────────────────────────

  describe('isBlocked', () => {
    it('returns true when the Redis key exists', async () => {
      redis.exists.mockResolvedValue(1);
      expect(await service.isBlocked('10.0.0.1')).toBe(true);
      expect(redis.exists).toHaveBeenCalledWith('honeypot:blocked:10.0.0.1');
    });

    it('returns false when the Redis key is absent', async () => {
      redis.exists.mockResolvedValue(0);
      expect(await service.isBlocked('10.0.0.2')).toBe(false);
    });
  });

  // ─── recordHit ─────────────────────────────────────────────────────────────

  describe('recordHit', () => {
    it('writes IP to Redis blocklist with configured TTL', async () => {
      await service.recordHit('192.168.1.1', '/wp-admin', 'GET', 'Mozilla/5.0');
      expect(redis.set).toHaveBeenCalledWith(
        'honeypot:blocked:192.168.1.1',
        '1',
        HONEYPOT_BAN_TTL_SECONDS_DEFAULT,
      );
    });

    it('emits a Kafka SECURITY log event via logProducer', async () => {
      await service.recordHit('192.168.1.1', '/.env', 'POST', 'scanner/1.0');
      expect(logProducer.warn).toHaveBeenCalledWith(
        'api-gateway',
        expect.anything(), // LogCategory.SECURITY
        'Honeypot triggered',
        expect.objectContaining({
          metadata: expect.objectContaining({
            ip: '192.168.1.1',
            path: '/.env',
            method: 'POST',
            userAgent: 'scanner/1.0',
          }),
        }),
      );
    });

    it('does not throw when Redis set fails', async () => {
      redis.set.mockRejectedValue(new Error('Redis unavailable'));
      await expect(
        service.recordHit('1.2.3.4', '/.env', 'GET', 'bot'),
      ).rejects.toThrow('Redis unavailable');
    });
  });

  // ─── unblock ───────────────────────────────────────────────────────────────

  describe('unblock', () => {
    it('deletes the Redis blocklist key for the given IP', async () => {
      await service.unblock('10.10.10.10');
      expect(redis.del).toHaveBeenCalledWith('honeypot:blocked:10.10.10.10');
    });
  });

  // ─── remainingBanTtl ───────────────────────────────────────────────────────

  describe('remainingBanTtl', () => {
    it('returns the TTL from Redis for a blocked IP', async () => {
      redis.ttl.mockResolvedValue(1800);
      const ttl = await service.remainingBanTtl('5.5.5.5');
      expect(ttl).toBe(1800);
      expect(redis.ttl).toHaveBeenCalledWith('honeypot:blocked:5.5.5.5');
    });

    it('returns -2 when the key does not exist', async () => {
      redis.ttl.mockResolvedValue(-2);
      expect(await service.remainingBanTtl('9.9.9.9')).toBe(-2);
    });
  });
});
