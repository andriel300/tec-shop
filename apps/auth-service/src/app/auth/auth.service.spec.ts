import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { LoginDto, SignupDto, VerifyEmailDto } from '@tec-shop/dto';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let prismaService: AuthPrismaService;
  let redisService: RedisService;
  let emailService: EmailService;
  let userClient: ClientProxy;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashed-password123',
    isEmailVerified: true,
    googleId: null,
    provider: 'local',
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
              create: jest.fn(),
              update: jest.fn(),
            },
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<AuthPrismaService>(AuthPrismaService);
    redisService = module.get<RedisService>(RedisService);
    emailService = module.get<EmailService>(EmailService);
    userClient = module.get<ClientProxy>('USER_SERVICE');

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

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
      confirmPassword: 'password123',
      termsAccepted: true,
    };

    it('should successfully register a new user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);
      jest.spyOn(emailService, 'sendOtp').mockResolvedValue(undefined);

      const result = await service.signup(signupDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(emailService.sendOtp).toHaveBeenCalledWith(
        signupDto.email,
        expect.any(String)
      );
      expect(result).toEqual({
        message:
          'Signup successful. Please check your email to verify your account.',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException
      );
    });
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
        rememberMe: false
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto: VerifyEmailDto = {
      email: 'test@example.com',
      otp: '123456',
    };
    it('should verify email correctly', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValue(JSON.stringify({ otp: '123456', name: 'John Doe' }));
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({ ...mockUser, isEmailVerified: true });
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);
      jest.spyOn(userClient, 'send').mockReturnValue(of({ success: true }));

      const result = await service.verifyEmail(verifyEmailDto);
      expect(result).toEqual({ message: 'Email verified successfully.' });
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
      expect(result).toEqual({ valid: false, userId: null, role: null });
    });
  });
});
