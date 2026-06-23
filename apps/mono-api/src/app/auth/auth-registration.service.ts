import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomInt, randomBytes, createHash } from 'crypto';
import { MonoPrismaService } from '../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';
import { UserProfileService } from '../user/user-profile.service';
import { SellerProfileService } from '../seller/seller-profile.service';
import type {
  SignupDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordWithCodeDto,
  ValidateResetTokenDto,
  SellerSignupDto,
} from '@tec-shop/dto';

@Injectable()
export class AuthRegistrationService {
  private readonly logger = new Logger(AuthRegistrationService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private prisma: MonoPrismaService,
    private redisService: RedisService,
    private readonly userProfileService: UserProfileService,
    private readonly sellerProfileService: SellerProfileService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  async signup(signupDto: SignupDto) {
    try {
      this.logger.log(`Customer signup attempt - email: ${signupDto.email}`);
      const { email, password, name } = signupDto;

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Signup attempt for already-registered email (silent): ${email}`);
        return {
          message: 'Signup successful. Please check your email to verify your account.',
        };
      }

      const hashedPassword = await argon2.hash(password);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          isEmailVerified: false,
        },
      });

      this.logger.debug(`User created - ID: ${user.id}`);

      const otp = randomInt(100000, 1000000).toString().padStart(6, '0');
      const redisPayload = JSON.stringify({ otp, name });
      await this.redisService.set(
        `verification-otp:${user.id}`,
        redisPayload,
        600
      );

      this.logger.debug(`Sending verification email to: ${user.email}`);
      // NOTE: Email sending via notification system is omitted in monolith.
      // The OTP is stored in Redis and can be retrieved for verification.
      // In production, integrate with an email service directly.

      this.logger.log(`Customer signup successful - userId: ${user.id}, email: ${email}`);

      return {
        message: 'Signup successful. Please check your email to verify your account.',
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

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Seller signup attempt for already-registered email (silent): ${email}`);
        return {
          message: 'Seller signup successful. Please check your email to verify your account.',
        };
      }

      const hashedPassword = await argon2.hash(password);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          isEmailVerified: false,
          userType: 'SELLER',
        },
      });

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

      this.logger.log(`Seller signup successful - userId: ${user.id}, email: ${email}`);

      return {
        message: 'Seller signup successful. Please check your email to verify your account.',
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
      throw new UnauthorizedException('Invalid verification details');
    }

    const attemptKey = `otp-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      await this.redisService.del(`verification-otp:${user.id}`);
      throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
    }

    const redisPayload = await this.redisService.get(
      `verification-otp:${user.id}`
    );

    if (!redisPayload) {
      throw new UnauthorizedException('Invalid verification details');
    }

    const { otp: storedOtp, name } = JSON.parse(redisPayload);

    if (storedOtp !== otp) {
      await this.redisService.set(attemptKey, (attempts + 1).toString(), 600);
      throw new UnauthorizedException('Invalid verification details');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.redisService.del(`verification-otp:${user.id}`);
    await this.redisService.del(`otp-attempts:${user.id}`);

    // Create user profile directly
    try {
      await this.userProfileService.createUserProfile({
        userId: user.id,
        name,
      });
      this.logger.log(`User profile created successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to create user profile:', error);
    }

    return { message: 'Email verified successfully.' };
  }

  async verifySellerEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email, userType: 'SELLER' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification details');
    }

    const attemptKey = `otp-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      await this.redisService.del(`verification-otp:${user.id}`);
      throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
    }

    const redisPayload = await this.redisService.get(
      `verification-otp:${user.id}`
    );

    if (!redisPayload) {
      throw new UnauthorizedException('Invalid verification details');
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
      throw new UnauthorizedException('Invalid verification details');
    }

    if (userType !== 'SELLER') {
      throw new UnauthorizedException('Invalid verification type');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.redisService.del(`verification-otp:${user.id}`);
    await this.redisService.del(`otp-attempts:${user.id}`);

    // Create seller profile directly (no mTLS/SignedRequest needed in monolith)
    try {
      await this.sellerProfileService.createSellerProfile({
        authId: user.id,
        name,
        email: user.email,
        phoneNumber,
        country,
      });
      this.logger.log(`Seller profile created successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to create seller profile:', error);
    }

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

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    await this.redisService.del(`reset-attempts:${user.id}`);

    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    this.logger.log(`Password reset email sent to: ${user.email}, resetLink: ${resetLink}`);

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
      throw new UnauthorizedException('Invalid or expired reset token');
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
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await argon2.hash(newPassword);

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

    this.logger.log(`Password reset successful - userId: ${resetToken.userId}`);

    return { message: 'Password has been reset successfully.' };
  }

  // Legacy method - keep for backward compatibility during transition
  async resetPasswordWithCode(resetPasswordDto: ResetPasswordWithCodeDto) {
    const { email, code, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isEmailVerified) {
      throw new UnauthorizedException('Invalid reset credentials');
    }

    const attemptKey = `reset-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      throw new UnauthorizedException('Too many failed attempts. Please request a new reset code.');
    }

    const codeHash = createHash('sha256').update(code).digest('hex');

    const storedUserId = await this.redisService.get(
      `password-reset:${codeHash}`
    );

    if (!storedUserId || storedUserId !== user.id) {
      await this.redisService.set(attemptKey, (attempts + 1).toString(), 600);
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    const hashedPassword = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.redisService.del(`password-reset:${codeHash}`);
    await this.redisService.del(`reset-attempts:${user.id}`);

    this.logger.log(`Password reset successful (code) - userId: ${user.id}`);

    return { message: 'Password has been reset successfully.' };
  }
}
