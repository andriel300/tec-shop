import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { LoginDto, SignupDto, VerifyEmailDto } from '@tec-shop/shared/dto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let prismaService: AuthPrismaService;
  let redisService: RedisService;
  let emailService: EmailService;
  let userClient: ClientProxy;

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

    jest.spyOn(bcrypt, 'hash').mockImplementation((password) => Promise.resolve(`hashed-${password}`));
    jest.spyOn(bcrypt, 'compare').mockImplementation((password, hash) => Promise.resolve(`hashed-${password}` === hash));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: '1',
        email: signupDto.email,
        password: 'hashed-password123',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(redisService, 'set').mockResolvedValue('OK');
      jest.spyOn(emailService, 'sendOtp').mockResolvedValue(undefined);

      const result = await service.signup(signupDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: signupDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(emailService.sendOtp).toHaveBeenCalledWith(signupDto.email, expect.any(String));
      expect(result).toEqual({ message: 'Signup successful. Please check your email to verify your account.' });
    });

    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: '1',
        email: signupDto.email,
        password: 'hashed-password123',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockUser = {
      id: '1',
      email: loginDto.email,
      password: 'hashed-password123',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully log in a user and return a token', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mockAccessToken');

      const result = await service.login(loginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: loginDto.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, username: mockUser.email });
      expect(result).toEqual({ access_token: 'mockAccessToken' });
    });

    it('should throw UnauthorizedException for invalid credentials (user not found)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid credentials (wrong password)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email is not verified', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ ...mockUser, isEmailVerified: false });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto: VerifyEmailDto = { email: 'test@example.com', otp: '123456' };
    const mockUser = {
      id: '1',
      email: verifyEmailDto.email,
      password: 'hashed-password123',
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully verify email', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify({ otp: verifyEmailDto.otp, name: 'John Doe' }));
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({ ...mockUser, isEmailVerified: true });
      jest.spyOn(redisService, 'del').mockResolvedValue(1);
      jest.spyOn(userClient, 'emit').mockReturnValue({} as any);

      const result = await service.verifyEmail(verifyEmailDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: verifyEmailDto.email } });
      expect(redisService.get).toHaveBeenCalledWith(`verification-otp:${mockUser.id}`);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isEmailVerified: true },
      });
      expect(redisService.del).toHaveBeenCalledWith(`verification-otp:${mockUser.id}`);
      expect(userClient.emit).toHaveBeenCalledWith('create-user-profile', {
        userId: mockUser.id,
        email: mockUser.email,
        name: 'John Doe',
      });
      expect(result).toEqual({ message: 'Email verified successfully.' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if OTP is invalid or expired (no redis payload)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if OTP is incorrect', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify({ otp: 'wrong-otp', name: 'John Doe' }));

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    const token = 'some-jwt-token';
    const decodedPayload = { sub: '123', username: 'test@example.com', role: 'user' };

    it('should return valid token info if token is valid', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedPayload);

      const result = await service.validateToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(result).toEqual({ valid: true, userId: decodedPayload.sub, role: decodedPayload.role });
    });

    it('should return invalid token info if token is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(result).toEqual({ valid: false, userId: null, role: null });
    });
  });
});
