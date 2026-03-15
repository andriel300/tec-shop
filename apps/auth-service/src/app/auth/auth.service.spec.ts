import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';
import { EmailService } from '../email/email.service';
import { LogProducerService } from '@tec-shop/logger-producer';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto, SignupDto, VerifyEmailDto, ForgotPasswordDto } from '@tec-shop/dto';
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
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            passwordResetToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
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

    it('should return success message silently if user already exists (prevents email enumeration)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.signup(signupDto);
      expect(result).toEqual({
        message:
          'Signup successful. Please check your email to verify your account.',
      });
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
      // The userType filter means findUnique returns null for a SELLER email
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

    it('should throw UnauthorizedException when OTP does not match', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('0') // attempts key
        .mockResolvedValueOnce(
          JSON.stringify({ otp: '999999', name: 'John Doe' })
        ); // wrong stored OTP
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('otp-attempts:'),
        '1',
        600
      );
    });

    it('should throw UnauthorizedException when OTP has expired (no Redis entry)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('0') // attempts key
        .mockResolvedValueOnce(null); // OTP expired

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw and delete OTP when max attempts are reached', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValueOnce('3'); // attempts >= 3
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        'Too many failed attempts. Please request a new OTP.'
      );
      expect(redisService.del).toHaveBeenCalledWith(
        expect.stringContaining('verification-otp:')
      );
    });

    it('should query with userType CUSTOMER filter to prevent a seller from verifying via the customer endpoint', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce(JSON.stringify({ otp: '123456', name: 'John Doe' }));
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);
      jest.spyOn(userClient, 'send').mockReturnValue(of({ success: true }));

      await service.verifyEmail(verifyEmailDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: verifyEmailDto.email, userType: 'CUSTOMER' },
      });
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
      // First Redis.get call is for the blacklist entry — return a value to simulate a hit
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

  // -------------------------------------------------------------------------
  // forgotPassword
  // -------------------------------------------------------------------------

  describe('forgotPassword', () => {
    const forgotDto = { email: 'test@example.com' };
    const successMessage =
      'If an account with this email exists, you will receive a password reset link.';

    it('sends a reset email and returns success when the user exists and is verified', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'create')
        .mockResolvedValue({
          id: 'tok-1',
          token: 'abc123',
          userId: mockUser.id,
          used: false,
          expiresAt: new Date(Date.now() + 3600000),
        });
      jest
        .spyOn(emailService, 'sendPasswordResetLink')
        .mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotDto);

      expect(result).toEqual({ message: successMessage });
      expect(emailService.sendPasswordResetLink).toHaveBeenCalledWith(
        mockUser.email,
        expect.stringContaining('reset-password?token=')
      );
    });

    it('returns the same success message when the user does not exist (prevents email enumeration)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.forgotPassword(forgotDto);

      expect(result).toEqual({ message: successMessage });
      expect(emailService.sendPasswordResetLink).not.toHaveBeenCalled();
    });

    it('returns the same success message when the user email is not verified (prevents email enumeration)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });

      const result = await service.forgotPassword(forgotDto);

      expect(result).toEqual({ message: successMessage });
      expect(emailService.sendPasswordResetLink).not.toHaveBeenCalled();
    });

    it('clears reset-attempts counter so the new code does not immediately lock the user out (user-trap fix)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'create')
        .mockResolvedValue({
          id: 'tok-2',
          token: 'new-token',
          userId: mockUser.id,
          used: false,
          expiresAt: new Date(Date.now() + 3600000),
        });
      jest.spyOn(emailService, 'sendPasswordResetLink').mockResolvedValue(undefined);
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);

      await service.forgotPassword(forgotDto);

      expect(redisService.del).toHaveBeenCalledWith(`reset-attempts:${mockUser.id}`);
    });
  });

  // -------------------------------------------------------------------------
  // resetPassword
  // -------------------------------------------------------------------------

  describe('resetPassword', () => {
    const mockResetToken = {
      id: 'reset-id-1',
      token: 'valid-reset-token',
      userId: mockUser.id,
      used: false,
      expiresAt: new Date(Date.now() + 3600000),
      user: { ...mockUser, isEmailVerified: true },
    };

    it('hashes the new password, marks the token used, and sends a confirmation email', async () => {
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'findUnique')
        .mockResolvedValue(mockResetToken);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'update')
        .mockResolvedValue({ ...mockResetToken, used: true });
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'deleteMany')
        .mockResolvedValue({ count: 1 });
      jest
        .spyOn(emailService, 'sendPasswordChangedNotification')
        .mockResolvedValue(undefined);

      const result = await service.resetPassword({
        token: 'valid-reset-token',
        newPassword: 'NewPass123!',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
      expect(result).toEqual({
        message: 'Password has been reset successfully.',
      });
      expect(emailService.sendPasswordChangedNotification).toHaveBeenCalledWith(
        mockUser.email
      );
    });

    it('throws UnauthorizedException for an invalid or expired token', async () => {
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'expired-or-invalid-token',
          newPassword: 'NewPass123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // -------------------------------------------------------------------------
  // refreshToken
  // -------------------------------------------------------------------------

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
      jest.spyOn(redisService, 'get').mockResolvedValue('1'); // rememberMe=true
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await service.refreshToken('valid-refresh-token');

      expect(redisService.get).toHaveBeenCalledWith(`session-remember-me:${mockUser.id}`);
      // new tokens should re-persist rememberMe=true with the 30-day TTL
      expect(redisService.set).toHaveBeenCalledWith(
        `session-remember-me:${mockUser.id}`,
        '1',
        30 * 24 * 60 * 60
      );
    });

    it('defaults to rememberMe=false (7-day session) when no Redis key is present', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValue(null); // no key
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await service.refreshToken('valid-refresh-token');

      expect(redisService.set).toHaveBeenCalledWith(
        `session-remember-me:${mockUser.id}`,
        '0',
        7 * 24 * 60 * 60
      );
    });
  });

  // -------------------------------------------------------------------------
  // resetPasswordWithCode (legacy)
  // -------------------------------------------------------------------------

  describe('resetPasswordWithCode', () => {
    const dto = { email: 'test@example.com', code: '123456', newPassword: 'NewPass123!' };

    it('throws immediately when attempt count is already at 3 (attempt limit checked before code)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValueOnce('3'); // attempts = 3

      await expect(service.resetPasswordWithCode(dto)).rejects.toThrow(
        'Too many failed attempts. Please request a new reset code.'
      );
      // Must not proceed to code lookup
      expect(redisService.get).toHaveBeenCalledTimes(1);
    });

    it('increments attempt counter and throws on a wrong code', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('1')  // attempts = 1
        .mockResolvedValueOnce(null); // no matching code in Redis
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await expect(service.resetPasswordWithCode(dto)).rejects.toThrow(
        'Invalid or expired reset code'
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `reset-attempts:${mockUser.id}`,
        '2',
        600
      );
    });

    it('resets the password and cleans up Redis on a valid code', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('0')          // attempts = 0
        .mockResolvedValueOnce(mockUser.id); // matching userId stored for this code hash
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);
      jest.spyOn(emailService, 'sendPasswordChangedNotification').mockResolvedValue(undefined);

      const result = await service.resetPasswordWithCode(dto);

      expect(result).toEqual({ message: 'Password has been reset successfully.' });
      expect(redisService.del).toHaveBeenCalledWith(expect.stringContaining('password-reset:'));
      expect(redisService.del).toHaveBeenCalledWith(`reset-attempts:${mockUser.id}`);
      expect(emailService.sendPasswordChangedNotification).toHaveBeenCalledWith(mockUser.email);
    });
  });
});
