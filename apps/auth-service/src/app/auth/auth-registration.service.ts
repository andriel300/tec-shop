import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt, randomBytes, createHash } from 'crypto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { LogCategory } from '@tec-shop/dto';
import type {
  SignupDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordWithCodeDto,
  ValidateResetTokenDto,
  SellerSignupDto,
} from '@tec-shop/dto';
import { EmailService } from '../email/email.service';
import { RedisService } from '@tec-shop/redis-client';
import { ServiceAuthUtil } from '@tec-shop/service-auth';
import { LogProducerService } from '@tec-shop/logger-producer';
import { NotificationProducerService } from '@tec-shop/notification-producer';

@Injectable()
export class AuthRegistrationService {
  private readonly logger = new Logger(AuthRegistrationService.name);
  private readonly serviceMasterSecret: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private prisma: AuthPrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    private readonly logProducer: LogProducerService,
    private readonly notificationProducer: NotificationProducerService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('SELLER_SERVICE') private readonly sellerClient: ClientProxy
  ) {
    const secret = this.configService.get<string>('SERVICE_MASTER_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('SERVICE_MASTER_SECRET environment variable is not configured');
    }
    this.serviceMasterSecret = secret;
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  async signup(signupDto: SignupDto) {
    try {
      this.logger.log(`Customer signup attempt - email: ${signupDto.email}`);
      const { email, password, name } = signupDto;

      this.logger.debug('Checking if user already exists');
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Signup attempt for already-registered email (silent): ${email}`);
        this.logProducer.warn('auth-service', LogCategory.AUTH, 'Customer signup skipped - duplicate email (not disclosed)', {
          metadata: { action: 'signup', reason: 'duplicate_email' },
        });
        return {
          message: 'Signup successful. Please check your email to verify your account.',
        };
      }

      this.logger.debug('Hashing password');
      const hashedPassword = await bcrypt.hash(password, 10);

      this.logger.debug('Creating user record');
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          isEmailVerified: false,
        },
      });

      this.logger.debug(`User created - ID: ${user.id}`);

      this.logger.debug('Generating OTP');
      const otp = randomInt(100000, 1000000).toString().padStart(6, '0');
      const redisPayload = JSON.stringify({ otp, name });
      await this.redisService.set(
        `verification-otp:${user.id}`,
        redisPayload,
        600
      );

      this.logger.debug(`Sending verification email to: ${user.email}`);
      await this.emailService.sendOtp(user.email, otp);

      this.logger.log(`Customer signup successful - userId: ${user.id}, email: ${email}`);
      this.logProducer.info('auth-service', LogCategory.AUTH, 'Customer signup successful', {
        userId: user.id,
        metadata: { action: 'signup', userType: 'CUSTOMER' },
      });

      return {
        message:
          'Signup successful. Please check your email to verify your account.',
      };
    } catch (error) {
      this.logger.error(
        `Customer signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async sellerSignup(sellerSignupDto: SellerSignupDto) {
    try {
      this.logger.log(`Seller signup attempt - email: ${sellerSignupDto.email}`);
      const { email, password, name, phoneNumber, country } = sellerSignupDto;

      this.logger.debug('Checking if seller already exists');
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Seller signup attempt for already-registered email (silent): ${email}`);
        this.logProducer.warn('auth-service', LogCategory.AUTH, 'Seller signup skipped - duplicate email (not disclosed)', {
          metadata: { action: 'signup', reason: 'duplicate_email', userType: 'SELLER' },
        });
        return {
          message: 'Seller signup successful. Please check your email to verify your account.',
        };
      }

      this.logger.debug('Hashing seller password');
      const hashedPassword = await bcrypt.hash(password, 10);

      this.logger.debug('Creating seller user record');
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          isEmailVerified: false,
          userType: 'SELLER',
        },
      });

      this.logger.debug(`Seller user created - ID: ${user.id}`);

      this.logger.debug('Generating OTP with seller profile data');
      const otp = randomInt(100000, 1000000).toString().padStart(6, '0');
      const redisPayload = JSON.stringify({
        otp,
        name,
        phoneNumber,
        country,
        userType: 'SELLER',
      });
      await this.redisService.set(
        `verification-otp:${user.id}`,
        redisPayload,
        600
      );

      this.logger.debug(`Sending verification email to seller: ${user.email}`);
      await this.emailService.sendOtp(user.email, otp);

      this.logger.log(`Seller signup successful - userId: ${user.id}, email: ${email}`);
      this.logProducer.info('auth-service', LogCategory.AUTH, 'Seller signup successful', {
        userId: user.id,
        metadata: { action: 'signup', userType: 'SELLER' },
      });

      return {
        message:
          'Seller signup successful. Please check your email to verify your account.',
      };
    } catch (error) {
      this.logger.error(
        `Seller signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email, userType: 'CUSTOMER' },
    });

    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'Invalid verification details' });
    }

    const attemptKey = `otp-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      await this.redisService.del(`verification-otp:${user.id}`);
      throw new RpcException({ statusCode: 401, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    const redisPayload = await this.redisService.get(
      `verification-otp:${user.id}`
    );

    if (!redisPayload) {
      throw new RpcException({ statusCode: 401, message: 'Invalid verification details' });
    }

    const { otp: storedOtp, name } = JSON.parse(redisPayload);

    if (storedOtp !== otp) {
      await this.redisService.set(attemptKey, (attempts + 1).toString(), 600);
      throw new RpcException({ statusCode: 401, message: 'Invalid verification details' });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.redisService.del(`verification-otp:${user.id}`);
    await this.redisService.del(`otp-attempts:${user.id}`);

    this.logProducer.info('auth-service', LogCategory.AUTH, 'Email verified successfully', {
      userId: user.id,
      metadata: { action: 'verify_email', userType: 'CUSTOMER' },
    });

    try {
      await firstValueFrom(
        this.userClient.send('create-user-profile', {
          userId: user.id,
          name,
        })
      );
      this.logger.log(`User profile created successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to create user profile in user-service:', error);
      this.logProducer.error('auth-service', LogCategory.SYSTEM, 'Failed to create user profile in user-service', {
        userId: user.id,
        metadata: { action: 'create_profile', targetService: 'user-service' },
      });
    }

    this.notificationProducer.notifyCustomer(user.id, 'auth.welcome', { name });

    this.notificationProducer.notifyAdmin('system.new_user_registered', {
      name,
      email: user.email,
    });

    return { message: 'Email verified successfully.' };
  }

  async verifySellerEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email, userType: 'SELLER' },
    });

    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'Invalid verification details' });
    }

    const attemptKey = `otp-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      await this.redisService.del(`verification-otp:${user.id}`);
      throw new RpcException({ statusCode: 401, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    const redisPayload = await this.redisService.get(
      `verification-otp:${user.id}`
    );

    if (!redisPayload) {
      throw new RpcException({ statusCode: 401, message: 'Invalid verification details' });
    }

    const {
      otp: storedOtp,
      name,
      phoneNumber,
      country,
      userType,
    } = JSON.parse(redisPayload);

    if (storedOtp !== otp) {
      await this.redisService.set(attemptKey, (attempts + 1).toString(), 600);
      throw new RpcException({ statusCode: 401, message: 'Invalid verification details' });
    }

    if (userType !== 'SELLER') {
      throw new RpcException({ statusCode: 401, message: 'Invalid verification type' });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.redisService.del(`verification-otp:${user.id}`);
    await this.redisService.del(`otp-attempts:${user.id}`);

    try {
      const profileData = {
        authId: user.id,
        name,
        email: user.email,
        phoneNumber,
        country,
      };

      const serviceSecret = ServiceAuthUtil.deriveServiceSecret(
        this.serviceMasterSecret,
        'auth-service'
      );

      const signedRequest = ServiceAuthUtil.signRequest(
        profileData,
        'auth-service',
        serviceSecret
      );

      await firstValueFrom(
        this.sellerClient.send('create-seller-profile-signed', signedRequest)
      );
      this.logger.log(`Seller profile created successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error(
        'Failed to create seller profile in seller-service:',
        error
      );
      this.logProducer.error('auth-service', LogCategory.SYSTEM, 'Failed to create seller profile in seller-service', {
        userId: user.id,
        metadata: { action: 'create_profile', targetService: 'seller-service' },
      });
    }

    this.logProducer.info('auth-service', LogCategory.AUTH, 'Seller email verified successfully', {
      userId: user.id,
      metadata: { action: 'verify_email', userType: 'SELLER' },
    });

    this.notificationProducer.notifySeller(user.id, 'auth.welcome_seller', { name });

    this.notificationProducer.notifyAdmin('system.new_seller_registered', {
      name,
      email: user.email,
    });

    return { message: 'Seller email verified successfully.' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const successMessage =
      'If an account with this email exists, you will receive a password reset link.';

    if (!user || !user.isEmailVerified) {
      return { message: successMessage };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
      },
    });

    await this.redisService.del(`reset-attempts:${user.id}`);

    const resetToken = randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    await this.emailService.sendPasswordResetLink(user.email, resetLink);

    return { message: successMessage };
  }

  async validateResetToken(validateResetTokenDto: ValidateResetTokenDto) {
    const { token } = validateResetTokenDto;

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            email: true,
            isEmailVerified: true,
          },
        },
      },
    });

    if (!resetToken || !resetToken.user.isEmailVerified) {
      throw new RpcException({ statusCode: 401, message: 'Invalid or expired reset token' });
    }

    return {
      valid: true,
      email: resetToken.user.email,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken || !resetToken.user.isEmailVerified) {
      throw new RpcException({ statusCode: 401, message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        used: true,
      },
    });

    await this.emailService.sendPasswordChangedNotification(
      resetToken.user.email
    );

    this.logProducer.info('auth-service', LogCategory.SECURITY, 'Password reset successful', {
      userId: resetToken.userId,
      metadata: { action: 'password_reset' },
    });

    return { message: 'Password has been reset successfully.' };
  }

  // Legacy method - keep for backward compatibility during transition
  async resetPasswordWithCode(resetPasswordDto: ResetPasswordWithCodeDto) {
    const { email, code, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isEmailVerified) {
      throw new RpcException({ statusCode: 401, message: 'Invalid reset credentials' });
    }

    const attemptKey = `reset-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      throw new RpcException({ statusCode: 401, message: 'Too many failed attempts. Please request a new reset code.' });
    }

    const codeHash = createHash('sha256').update(code).digest('hex');

    const storedUserId = await this.redisService.get(
      `password-reset:${codeHash}`
    );

    if (!storedUserId || storedUserId !== user.id) {
      await this.redisService.set(attemptKey, (attempts + 1).toString(), 600);
      throw new RpcException({ statusCode: 401, message: 'Invalid or expired reset code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.redisService.del(`password-reset:${codeHash}`);
    await this.redisService.del(`reset-attempts:${user.id}`);

    await this.emailService.sendPasswordChangedNotification(user.email);

    return { message: 'Password has been reset successfully.' };
  }
}
