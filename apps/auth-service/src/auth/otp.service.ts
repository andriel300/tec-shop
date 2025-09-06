import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly logger: Logger, // Added
  ) {
    this.logger = new Logger(OtpService.name); // Initialize logger
  }

  async generateOtp(
    generateOtpDto: GenerateOtpDto
  ): Promise<{ message: string }> {
    const { email } = generateOtpDto;

    const otpResendCooldownSeconds = this.configService.get<number>('OTP_RESEND_COOLDOWN_SECONDS', 60);
    const cooldownKey = `otp_cooldown:${email}`;

    // Check if email is in cooldown
    if (await this.redisService.get(cooldownKey)) {
      this.logger.warn(`OTP generation denied for ${email} due to cooldown.`); // Log cooldown denial
      throw new UnauthorizedException(`Please wait before requesting another OTP. Try again in ${otpResendCooldownSeconds} seconds.`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;
    const otpExpirySeconds = this.configService.get<number>('OTP_EXPIRY_SECONDS', 300);

    await this.redisService.set(otpKey, otp, otpExpirySeconds);
    await this.emailService.sendOtp(email, otp);
    this.logger.log(`OTP generated and sent to ${email}.`); // Log OTP generation

    // Set cooldown after sending OTP
    await this.redisService.set(cooldownKey, 'true', otpResendCooldownSeconds);

    return {
      message: `An OTP has been sent to ${email}. It will expire in ${otpExpirySeconds / 60} minutes.`,
    };
  }

  // New methods for OTP attempt limiting and account locking
  private async getFailedAttempts(email: string): Promise<number> {
    const key = `otp_failed_attempts:${email}`;
    const attempts = await this.redisService.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  private async setFailedAttempts(email: string, attempts: number, expirySeconds: number): Promise<void> {
    const key = `otp_failed_attempts:${email}`;
    await this.redisService.set(key, attempts.toString(), expirySeconds);
  }

  private async lockEmail(email: string, lockDurationSeconds: number): Promise<void> {
    const key = `otp_locked:${email}`;
    await this.redisService.set(key, 'true', lockDurationSeconds);
  }

  private async isEmailLocked(email: string): Promise<boolean> {
    const key = `otp_locked:${email}`;
    const locked = await this.redisService.get(key);
    return locked === 'true';
  }

  async validateOtp(email: string, otp: string): Promise<boolean> {
    // Check if email is locked
    if (await this.isEmailLocked(email)) {
      this.logger.warn(`OTP verification denied for ${email} due to account lock.`); // Log lock denial
      throw new UnauthorizedException('Too many failed OTP attempts. Please try again later.');
    }

    const otpKey = `otp:${email}`;
    const storedOtp = await this.redisService.get(otpKey);
    const isValid = storedOtp === otp;

    const otpMaxAttempts = this.configService.get<number>('OTP_MAX_ATTEMPTS', 3);
    const otpLockDurationSeconds = this.configService.get<number>('OTP_LOCK_DURATION_SECONDS', 1800); // 30 minutes

    if (!isValid) {
      const currentAttempts = await this.getFailedAttempts(email);
      const newAttempts = currentAttempts + 1;
      await this.setFailedAttempts(email, newAttempts, otpLockDurationSeconds); // Reset expiry on each failed attempt

      const attemptsLeft = otpMaxAttempts - newAttempts;

      if (newAttempts >= otpMaxAttempts) {
        await this.lockEmail(email, otpLockDurationSeconds);
        this.logger.error(`Account for ${email} locked due to too many failed OTP attempts.`); // Log account locked
        throw new UnauthorizedException('Too many failed OTP attempts. This email has been temporarily locked. Please try again after 30 minutes.');
      } else {
        this.logger.warn(`Incorrect OTP for ${email}. ${attemptsLeft} attempt(s) left.`); // Log incorrect OTP
        throw new UnauthorizedException(`Incorrect OTP. You have ${attemptsLeft} attempt(s) left.`);
      }
    } else {
      this.logger.log(`OTP successfully validated for ${email}.`); // Log successful validation
      // Reset failed attempts on successful validation
      await this.redisService.del(`otp_failed_attempts:${email}`);
    }

    return isValid;
  }

  async finalizeOtp(email: string): Promise<{ accessToken: string }> {
    const otpKey = `otp:${email}`;
    await this.redisService.del(otpKey);

    const payload = { sub: email, type: 'user', jti: uuidv4() };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto
  ): Promise<{ accessToken: string }> {
    const { email, otp } = verifyOtpDto;

    if (!await this.validateOtp(email, otp)) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    return this.finalizeOtp(email);
  }
}