import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: Partial<Redis>;

  beforeEach(async () => {
    mockRedisClient = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('should call redisClient.set with key, value, and expiration if provided', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const expire = 60;
      await service.set(key, value, expire);
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, 'EX', expire);
    });

    it('should call redisClient.set with key and value if no expiration', async () => {
      const key = 'test-key';
      const value = 'test-value';
      await service.set(key, value);
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });
  });

  describe('get', () => {
    it('should call redisClient.get with the key and return the value', async () => {
      const key = 'test-key';
      const expectedValue = 'retrieved-value';
      (mockRedisClient.get as jest.Mock).mockResolvedValue(expectedValue);

      const result = await service.get(key);
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(expectedValue);
    });
  });

  describe('del', () => {
    it('should call redisClient.del with the key', async () => {
      const key = 'test-key';
      await service.del(key);
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });
});
