import { Test, TestingModule } from '@nestjs/testing';
import { AuthCoreService } from './auth-core.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';
import { EmailService } from '../email/email.service';
import { LogProducerService } from '@tec-shop/logger-producer';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '@tec-shop/dto';

describe('AuthCoreService', () => {
  let service: AuthCoreService;
  let jwtService: JwtService;
  let prismaService: AuthPrismaService;
  let redisService: RedisService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashed-password123',
    isEmailVerified: true,
    userType: 'CUSTOMER' as const,
    googleId: null,
    provider: 'local',
    refreshToken: null,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCoreService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                SERVICE_MASTER_SECRET: 'test-master-secret-for-unit-tests',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mockAccessToken'),
            verify: jest.fn(),
          },
        },
        {
          provide: AuthPrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest
              .fn()
              .mockImplementation((ops: unknown[]) =>
                Promise.all(ops as Promise<unknown>[])
              ),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendOtp: jest.fn(),
            sendPasswordResetLink: jest.fn(),
            sendPasswordChangedNotification: jest.fn(),
            sendGoogleAccountLinkedNotification: jest.fn(),
          },
        },
        {
          provide: LogProducerService,
          useValue: {
            emit: jest.fn().mockResolvedValue(undefined),
            debug: jest.fn().mockResolvedValue(undefined),
            info: jest.fn().mockResolvedValue(undefined),
            warn: jest.fn().mockResolvedValue(undefined),
            error: jest.fn().mockResolvedValue(undefined),
            fatal: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NotificationProducerService,
          useValue: {
            notifyCustomer: jest.fn().mockResolvedValue(undefined),
            notifySeller: jest.fn().mockResolvedValue(undefined),
            notifyAdmin: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: 'USER_SERVICE',
          useValue: {
            emit: jest.fn(),
            send: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: 'SELLER_SERVICE',
          useValue: {
            emit: jest.fn(),
            send: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthCoreService>(AuthCoreService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<AuthPrismaService>(AuthPrismaService);
    redisService = module.get<RedisService>(RedisService);

    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(async (password) => `hashed-${password}`);
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation(
        async (password, hash) => `hashed-${password}` === hash
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully log in a user and return a token', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(
          async (password, hash) => `hashed-${password}` === hash
        );

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mockAccessToken',
        refresh_token: expect.any(String),
        rememberMe: false,
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should query with userType CUSTOMER filter to prevent cross-role token issuance', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email, userType: 'CUSTOMER' },
      });
    });

    it('should reject a SELLER user attempting to use the customer login endpoint', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should persist rememberMe=true to Redis so token refresh can restore a 30-day session', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await service.login({ ...loginDto, rememberMe: true });

      expect(redisService.set).toHaveBeenCalledWith(
        `session-remember-me:${mockUser.id}`,
        '1',
        30 * 24 * 60 * 60
      );
    });

    it('should persist rememberMe=false to Redis for a normal 7-day session', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await service.login({ ...loginDto, rememberMe: false });

      expect(redisService.set).toHaveBeenCalledWith(
        `session-remember-me:${mockUser.id}`,
        '0',
        7 * 24 * 60 * 60
      );
    });
  });

  describe('validateToken', () => {
    it('should return valid info for a valid token', async () => {
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: '123', role: 'user' });
      const result = await service.validateToken('token');
      expect(result).toEqual({ valid: true, userId: '123', role: 'user' });
    });

    it('should return invalid info for an invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid');
      });
      const result = await service.validateToken('token');
      expect(result).toEqual({
        valid: false,
        userId: null,
        role: null,
        reason: 'token_invalid',
      });
    });

    it('should return token_revoked when token is on the blacklist', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: '123',
        role: 'CUSTOMER',
        iat: 0,
        exp: 9999999999,
      });
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValue(JSON.stringify({ reason: 'logout' }));

      const result = await service.validateToken('blacklisted-token');

      expect(result).toEqual({
        valid: false,
        userId: null,
        role: null,
        reason: 'token_revoked',
      });
    });
  });

  describe('refreshToken', () => {
    it('returns new tokens when the refresh token is valid', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toEqual(
        expect.objectContaining({ userId: mockUser.id, email: mockUser.email })
      );
    });

    it('throws UnauthorizedException when the refresh token does not match any user', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('recovers rememberMe=true from Redis and issues a 30-day refresh token', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValue('1');
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await service.refreshToken('valid-refresh-token');

      expect(redisService.get).toHaveBeenCalledWith(`session-remember-me:${mockUser.id}`);
      expect(redisService.set).toHaveBeenCalledWith(
        `session-remember-me:${mockUser.id}`,
        '1',
        30 * 24 * 60 * 60
      );
    });

    it('defaults to rememberMe=false (7-day session) when no Redis key is present', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await service.refreshToken('valid-refresh-token');

      expect(redisService.set).toHaveBeenCalledWith(
        `session-remember-me:${mockUser.id}`,
        '0',
        7 * 24 * 60 * 60
      );
    });
  });
});
