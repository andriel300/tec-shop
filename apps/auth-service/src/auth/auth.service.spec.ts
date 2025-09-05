import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../app/prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OtpService } from './otp.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';

// Mock services
const mockPrismaService = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockOtpService = {
  generateOtp: jest.fn(),
  verifyOtp: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    if (key === 'PASSWORD_RESET_EXPIRY_SECONDS') return 3600;
    if (key === 'FRONTEND_URL') return 'http://localhost:4200';
    return defaultValue;
  }),
};

const mockEmailService = {
  sendPasswordResetLink: jest.fn(),
};

const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

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
      expect(result).toEqual({ message: 'User registered successfully.' });
    });
  });

  describe('generateOtp', () => {
    it('should call otpService.generateOtp', async () => {
      const emailDto = { email: 'test@example.com' };
      mockOtpService.generateOtp.mockResolvedValue({ message: 'OTP sent.' });
      await service.generateOtp(emailDto);
      expect(mockOtpService.generateOtp).toHaveBeenCalledWith(emailDto);
    });
  });

  describe('verifyOtp', () => {
    const verifyDto = { email: 'test@example.com', otp: '123456' };

    it('should call otpService.verifyOtp', async () => {
      mockOtpService.verifyOtp.mockResolvedValue({ accessToken: 'test_token' });
      const result = await service.verifyOtp(verifyDto);
      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith(verifyDto);
      expect(result).toEqual({ accessToken: 'test_token' });
    });
  });

  describe('requestPasswordReset', () => {
    const requestDto = { email: 'test@example.com' };

    it('should send a password reset link if user exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ id: 'user-id', email: requestDto.email });
      mockRedisService.set.mockResolvedValue('OK');
      mockEmailService.sendPasswordResetLink.mockResolvedValue(undefined);

      const result = await service.requestPasswordReset(requestDto);

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({ where: { email: requestDto.email } });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('password-reset:'),
        'user-id',
        3600
      );
      expect(mockEmailService.sendPasswordResetLink).toHaveBeenCalledWith(
        requestDto.email,
        expect.stringContaining('http://localhost:4200/reset-password?token=')
      );
      expect(result).toEqual({ message: 'If an account with that email exists, a password reset link has been sent.' });
    });

    it('should return success message even if user does not exist', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset(requestDto);

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({ where: { email: requestDto.email } });
      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetLink).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'If an account with that email exists, a password reset link has been sent.' });
    });
  });

  describe('resetPassword', () => {
    const resetDto = { email: 'test@example.com', token: 'valid-token', newPassword: 'NewSecurePassword123' };

    it('should throw UnauthorizedException if token is invalid or expired', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockRedisService.get).toHaveBeenCalledWith(`password-reset:${resetDto.token}`);
    });

    it('should throw UnauthorizedException if user not found or email does not match', async () => {
      mockRedisService.get.mockResolvedValue('user-id');
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    });

    it('should reset password and delete token if valid', async () => {
      mockRedisService.get.mockResolvedValue('user-id');
      mockPrismaService.users.findUnique.mockResolvedValue({ id: 'user-id', email: resetDto.email });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
      mockPrismaService.users.update.mockResolvedValue({ id: 'user-id', email: resetDto.email, password: 'hashedNewPassword' });
      mockRedisService.del.mockResolvedValue(1);

      const result = await service.resetPassword(resetDto);

      expect(mockRedisService.get).toHaveBeenCalledWith(`password-reset:${resetDto.token}`);
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({ where: { id: 'user-id' } });
      expect(bcrypt.hash).toHaveBeenCalledWith(resetDto.newPassword, 10);
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { password: 'hashedNewPassword' },
      });
      expect(mockRedisService.del).toHaveBeenCalledWith(`password-reset:${resetDto.token}`);
      expect(result).toEqual({ message: 'Password has been reset successfully.' });
    });
  });
});
