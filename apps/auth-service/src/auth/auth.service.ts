import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { SignupUserDto } from './dto/signup-user.dto';
import { PrismaService } from '../app/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { OtpService } from './otp.service';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { GoogleUser } from './interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService
  ) {}

  async signup(
    signupUserDto: SignupUserDto
  ): Promise<{ message: string }> {
    const { email } = signupUserDto;

    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    // Instead of creating the user, we generate and send an OTP
    await this.otpService.generateOtp({ email });

    return {
      message: `An OTP has been sent to ${email}. Please verify to complete registration.`,
    };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto
  ): Promise<{ accessToken: string }> {
    const { name, email, password, otp } = verifyEmailDto;

    const isValid = await this.otpService.validateOtp(email, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTenant = await this.prisma.tenant.create({
      data: {
        name: `${name}'s Store`,
      },
    });

    await this.prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isEmailVerified: true,
        tenantId: newTenant.id,
        roles: ['owner'],
      },
    });

    return this.otpService.issueSessionToken(email);
  }

  async login(
    loginDto: LoginDto
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, rememberMe } = loginDto;

    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please verify your email first.'
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      jti: uuidv4(),
      tenantId: user.tenantId,
      roles: user.roles,
    };
    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRATION',
        '15m'
      ),
    }); // Short-lived access token

    const refreshTokenExpiry = rememberMe
      ? this.configService.get<string>(
          'JWT_REFRESH_TOKEN_REMEMBER_ME_EXPIRATION',
          '30d'
        )
      : this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '7d'); // Adjust refresh token expiry based on rememberMe
    const refreshTokenPayload = { sub: user.id, jti: uuidv4() };
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      expiresIn: refreshTokenExpiry,
    }); // Long-lived refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10); // Hash the refresh token

    await this.prisma.users.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken }, // Store the hashed refresh token
    });

    return { accessToken, refreshToken };
  }

  async logout(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new UnauthorizedException('No token provided.');
    }

    try {
      const decoded = this.jwtService.decode(token) as {
        sub: string;
        jti: string;
        exp: number;
      };
      if (!decoded || !decoded.jti || !decoded.exp) {
        throw new UnauthorizedException('Invalid token.');
      }

      const { jti, exp } = decoded;
      const expiry = exp - Math.floor(Date.now() / 1000);

      if (expiry > 0) {
        const blacklistKey = `blacklist:${jti}`;
        await this.redisService.set(blacklistKey, 'true', expiry);
      }

      // Clear the refresh token from the user in the database
      const user = await this.prisma.users.findUnique({
        where: { id: decoded.sub },
      });
      if (user) {
        await this.prisma.users.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
      }

      return { message: 'Successfully logged out.' };
    } catch (error) {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const userId = decoded.sub;

      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }

      const accessTokenPayload = {
        sub: user.id,
        email: user.email,
        jti: uuidv4(),
        tenantId: user.tenantId,
        roles: user.roles,
      };
      const newAccessToken = await this.jwtService.signAsync(
        accessTokenPayload,
        {
          expiresIn: this.configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION',
            '15m'
          ),
        }
      );

      const refreshTokenPayload = { sub: user.id, jti: uuidv4() };
      const newRefreshToken = await this.jwtService.signAsync(
        refreshTokenPayload,
        {
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION',
            '7d'
          ),
        }
      );
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10); // Hash the new refresh token

      await this.prisma.users.update({
        where: { id: user.id },
        data: { refreshToken: hashedNewRefreshToken }, // Store the hashed new refresh token
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }
  async findUserById(payload: { id: string; email: string }) {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        tenantId: true,
        roles: true,
        isEmailVerified: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
  async validateGoogleUser(user: GoogleUser) {
    if (!user) {
      throw new UnauthorizedException('No user from Google.');
    }

    let existingUser = await this.prisma.users.findUnique({
      where: { googleId: user.googleId },
    });

    if (!existingUser) {
      // Check if a user with this email already exists (e.g., local registration)
      existingUser = await this.prisma.users.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // Link existing local account to Google account
        existingUser = await this.prisma.users.update({
          where: { id: existingUser.id },
          data: {
            googleId: user.googleId,
            provider: 'google',
            picture: user.picture, // Update picture from Google
          },
        });
      } else {
        // Create new user and a new tenant
        const newTenant = await this.prisma.tenant.create({
          data: {
            name: `${user.name}'s Store`,
          },
        });

        existingUser = await this.prisma.users.create({
          data: {
            email: user.email,
            name: user.name,
            googleId: user.googleId,
            isEmailVerified: true, // Google verifies email
            provider: 'google',
            password: null, // No password for OAuth users
            picture: user.picture,
            tenantId: newTenant.id,
            roles: ['owner'],
          },
        });
      }
    } else {
      // Update existing Google user's info
      existingUser = await this.prisma.users.update({
        where: { id: existingUser.id },
        data: {
          name: user.name,
          picture: user.picture,
        },
      });
    }

    // Return the user object instead of tokens (handled in controller)
    return existingUser;
  }

  async generateOtp(
    generateOtpDto: GenerateOtpDto
  ): Promise<{ message: string }> {
    return this.otpService.generateOtp(generateOtpDto);
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto
  ): Promise<{ accessToken: string }> {
    return this.otpService.verifyOtp(verifyOtpDto);
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto
  ): Promise<{ message: string }> {
    const { email } = requestPasswordResetDto;

    const user = await this.prisma.users.findUnique({ where: { email } });

    // Even if the user doesn't exist, we return a success message to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const token = uuidv4();
    const resetLinkExpirySeconds = this.configService.get<number>(
      'PASSWORD_RESET_EXPIRY_SECONDS',
      3600
    ); // 1 hour
    const resetLinkKey = `password-reset:${token}`;

    await this.redisService.set(resetLinkKey, user.id, resetLinkExpirySeconds);

    const resetLink = `${this.configService.get<string>(
      'FRONTEND_URL'
    )}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetLink(email, resetLink);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto
  ): Promise<{ message: string }> {
    const { email, token, newPassword } = resetPasswordDto;

    const resetLinkKey = `password-reset:${token}`;
    const userId = await this.redisService.get(resetLinkKey);

    if (!userId) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token.'
      );
    }

    const user = await this.prisma.users.findUnique({ where: { id: userId } });

    if (!user || user.email !== email) {
      throw new UnauthorizedException('Invalid password reset token or email.');
    }

    // Check if the new password is the same as the old password
    if (user.password && (await bcrypt.compare(newPassword, user.password))) {
      throw new BadRequestException(
        'New password cannot be the same as the old password.'
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.redisService.del(resetLinkKey);

    // Send notification email
    await this.emailService.sendPasswordChangedNotification(user.email);

    return { message: 'Password has been reset successfully.' };
  }
}
