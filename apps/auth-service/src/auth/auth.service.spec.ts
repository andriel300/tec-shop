import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../app/prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';

// Mock services
const mockPrismaService = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};
const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};
const mockEmailService = {
  sendOtp: jest.fn(),
};
const mockJwtService = {
  signAsync: jest.fn(),
};

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let redis: RedisService;
  let email: EmailService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    email = module.get<EmailService>(EmailService);
    jwt = module.get<JwtService>(JwtService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = { name: 'Test User', email: 'test@example.com', password: 'password123' };

    it('should throw a ConflictException if user already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should hash password and create a new user', async () => {
      const hashedPassword = 'hashedPassword';
      const createdUser = {
        id: '1',
        email: registerDto.email,
        password: hashedPassword,
      };
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.users.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: { name: registerDto.name, email: registerDto.email, password: hashedPassword },
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('generateOtp', () => {
    it('should set an OTP in redis and send it via email', async () => {
      const emailDto = { email: 'test@example.com' };
      await service.generateOtp(emailDto);

      // Check that redis.set was called with a 6-digit string and 300s expiry
      expect(redis.set).toHaveBeenCalledWith(
        `otp:${emailDto.email}`,
        expect.stringMatching(/^\d{6}$/),
        300
      );

      // Check that email.sendOtp was called with the same OTP
      const otpSent = (mockRedisService.set as jest.Mock).mock.calls[0][1];
      expect(email.sendOtp).toHaveBeenCalledWith(emailDto.email, otpSent);
    });
  });

  describe('verifyOtp', () => {
    const verifyDto = { email: 'test@example.com', otp: '123456' };

    it('should throw UnauthorizedException if OTP is invalid', async () => {
      mockRedisService.get.mockResolvedValue(null);
      await expect(service.verifyOtp(verifyDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(redis.get).toHaveBeenCalledWith(`otp:${verifyDto.email}`);
    });

    it('should return an access token if OTP is valid', async () => {
      const accessToken = 'test_token';
      mockRedisService.get.mockResolvedValue(verifyDto.otp);
      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.verifyOtp(verifyDto);

      expect(redis.del).toHaveBeenCalledWith(`otp:${verifyDto.email}`);
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: verifyDto.email,
        type: 'user',
      });
      expect(result).toEqual({ accessToken });
    });
  });
});
