import { Test, TestingModule } from '@nestjs/testing';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';
import { EmailService } from '../email/email.service';
import { LogProducerService } from '@tec-shop/logger-producer';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { SignupDto, VerifyEmailDto } from '@tec-shop/dto';
import { of } from 'rxjs';

describe('AuthRegistrationService', () => {
  let service: AuthRegistrationService;
  let prismaService: AuthPrismaService;
  let redisService: RedisService;
  let emailService: EmailService;
  let userClient: ClientProxy;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: '$argon2id$hashed-password123',
    isEmailVerified: true,
    userType: 'CUSTOMER' as const,
    googleId: null,
    provider: 'local',
    refreshToken: null,
    refreshTokenFamily: null,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRegistrationService,
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

    service = module.get<AuthRegistrationService>(AuthRegistrationService);
    prismaService = module.get<AuthPrismaService>(AuthPrismaService);
    redisService = module.get<RedisService>(RedisService);
    emailService = module.get<EmailService>(EmailService);
    userClient = module.get<ClientProxy>('USER_SERVICE');

    jest
      .spyOn(argon2, 'hash')
      .mockImplementation(async (password) => `$argon2id$hashed-${password}`);
    jest
      .spyOn(argon2, 'verify')
      .mockImplementation(
        async (hash, plain) => hash === `$argon2id$hashed-${plain}`
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
      expect(argon2.hash).toHaveBeenCalledWith(signupDto.password);
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

    it('should throw RpcException when OTP does not match', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce(
          JSON.stringify({ otp: '999999', name: 'John Doe' })
        );
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        RpcException
      );
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('otp-attempts:'),
        '1',
        600
      );
    });

    it('should throw RpcException when OTP has expired (no Redis entry)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce(null);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        RpcException
      );
    });

    it('should throw and delete OTP when max attempts are reached', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValueOnce('3');
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

      expect(argon2.hash).toHaveBeenCalledWith('NewPass123!');
      expect(result).toEqual({
        message: 'Password has been reset successfully.',
      });
      expect(emailService.sendPasswordChangedNotification).toHaveBeenCalledWith(
        mockUser.email
      );
    });

    it('throws RpcException for an invalid or expired token', async () => {
      jest
        .spyOn(prismaService.passwordResetToken as unknown as Record<string, jest.Mock>, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'expired-or-invalid-token',
          newPassword: 'NewPass123!',
        })
      ).rejects.toThrow(RpcException);
    });
  });

  describe('resetPasswordWithCode', () => {
    const dto = { email: 'test@example.com', code: '123456', newPassword: 'NewPass123!' };

    it('throws immediately when attempt count is already at 3 (attempt limit checked before code)', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'get').mockResolvedValueOnce('3');

      await expect(service.resetPasswordWithCode(dto)).rejects.toThrow(
        'Too many failed attempts. Please request a new reset code.'
      );
      expect(redisService.get).toHaveBeenCalledTimes(1);
    });

    it('increments attempt counter and throws on a wrong code', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce(null);
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
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce(mockUser.id);
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
