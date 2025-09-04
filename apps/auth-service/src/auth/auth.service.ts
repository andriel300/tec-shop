import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<{ message: string }> {
    const { name, email, password } = registerUserDto;

    const existingUser = await this.prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { message: 'User registered successfully.' };
  }

  async generateOtp(generateOtpDto: GenerateOtpDto): Promise<{ message: string }> {
    return this.otpService.generateOtp(generateOtpDto);
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ accessToken: string }> {
    return this.otpService.verifyOtp(verifyOtpDto);
  }

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto): Promise<{ message: string }> {
    const { email } = requestPasswordResetDto;

    const user = await this.prisma.users.findUnique({ where: { email } });

    // Even if the user doesn't exist, we return a success message to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const token = uuidv4();
    const resetLinkExpirySeconds = this.configService.get<number>('PASSWORD_RESET_EXPIRY_SECONDS', 3600); // 1 hour
    const resetLinkKey = `password-reset:${token}`;

    await this.redisService.set(resetLinkKey, user.id, resetLinkExpirySeconds);

    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetLink(email, resetLink);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, token, newPassword } = resetPasswordDto;

    const resetLinkKey = `password-reset:${token}`;
    const userId = await this.redisService.get(resetLinkKey);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired password reset token.');
    }

    const user = await this.prisma.users.findUnique({ where: { id: userId } });

    if (!user || user.email !== email) {
      throw new UnauthorizedException('Invalid password reset token or email.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.redisService.del(resetLinkKey);

    return { message: 'Password has been reset successfully.' };
  }
}
