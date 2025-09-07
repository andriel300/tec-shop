import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

enum RedisKeys {
  OTP_COOLDOWN = 'otp_cooldown:',
  OTP = 'otp:',
  OTP_FAILED_ATTEMPTS = 'otp_failed_attempts:',
  OTP_LOCKED = 'otp_locked:',
}

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly logger: Logger
  ) {}

  async generateOtp(
    generateOtpDto: GenerateOtpDto
  ): Promise<{ message: string }> {
    const { email } = generateOtpDto;

    const otpResendCooldownSeconds = this.configService.get<number>(
      'OTP_RESEND_COOLDOWN_SECONDS',
      60
    );
    const cooldownKey = `${RedisKeys.OTP_COOLDOWN}${email}`;

    // Prevent Spam: It enforces a cooldown period so you can't request new codes too frequently,
    // protecting against email spam and denial-of-service attacks.
    if (await this.redisService.get(cooldownKey)) {
      this.logger.warn(`OTP generation denied for ${email} due to cooldown.`); // Log cooldown denial
      throw new UnauthorizedException(
        `Please wait before requesting another OTP. Try again in ${otpResendCooldownSeconds} seconds.`
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpKey = `${RedisKeys.OTP}${email}`;
    const otpExpirySeconds = this.configService.get<number>(
      'OTP_EXPIRY_SECONDS',
      300
    );

    await this.redisService.set(otpKey, otp, otpExpirySeconds);
    await this.emailService.sendOtp(email, otp);
    this.logger.log(`OTP generated and sent to ${email}.`); // Log OTP generation

    // Set cooldown after sending OTP
    await this.redisService.set(cooldownKey, 'true', otpResendCooldownSeconds);

    return {
      message: `An OTP has been sent to ${email}. It will expire in ${
        otpExpirySeconds / 60
      } minutes.`,
    };
  }

  // New methods for OTP attempt limiting and account locking
  // Prevent Brute-Force Attacks: This is its most important job. It counts failed attempts.
  // If you guess wrong too many times, it temporarily locks the account associated with the email,
  // stopping hackers from trying all possible combinations.
  private async getFailedAttempts(email: string): Promise<number> {
    const key = `${RedisKeys.OTP_FAILED_ATTEMPTS}${email}`;
    const attempts = await this.redisService.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  private async setFailedAttempts(
    email: string,
    attempts: number,
    expirySeconds: number
  ): Promise<void> {
    const key = `${RedisKeys.OTP_FAILED_ATTEMPTS}${email}`;
    await this.redisService.set(key, attempts.toString(), expirySeconds);
  }

  private async lockEmail(
    email: string,
    lockDurationSeconds: number
  ): Promise<void> {
    const key = `${RedisKeys.OTP_LOCKED}${email}`;
    await this.redisService.set(key, 'true', lockDurationSeconds);
  }

  private async isEmailLocked(email: string): Promise<boolean> {
    const key = `${RedisKeys.OTP_LOCKED}${email}`;
    const locked = await this.redisService.get(key);
    return locked === 'true';
  }

  async validateOtp(email: string, otp: string): Promise<boolean> {
    // Check if email is locked
    if (await this.isEmailLocked(email)) {
      this.logger.warn(
        `OTP verification denied for ${email} due to account lock.`
      ); // Log lock denial
      throw new UnauthorizedException(
        'Too many failed OTP attempts. Please try again later.'
      );
    }

    const otpKey = `${RedisKeys.OTP}${email}`;
    const storedOtp = await this.redisService.get(otpKey);

    // Constant-time comparison to mitigate timing attacks
    const otpBuffer = Buffer.from(otp);
    const storedOtpBuffer = Buffer.from(storedOtp || '');

    let isValid = false;
    if (storedOtp && otpBuffer.length === storedOtpBuffer.length) {
      isValid = crypto.timingSafeEqual(otpBuffer, storedOtpBuffer);
    }

    const otpMaxAttempts = this.configService.get<number>(
      'OTP_MAX_ATTEMPTS',
      3
    );
    const otpLockDurationSeconds = this.configService.get<number>(
      'OTP_LOCK_DURATION_SECONDS',
      1800
    ); // 30 minutes

    if (!isValid) {
      const currentAttempts = await this.getFailedAttempts(email);
      const newAttempts = currentAttempts + 1;
      await this.setFailedAttempts(email, newAttempts, otpLockDurationSeconds); // Reset expiry on each failed attempt

      const attemptsLeft = otpMaxAttempts - newAttempts;

      if (newAttempts >= otpMaxAttempts) {
        await this.lockEmail(email, otpLockDurationSeconds);
        this.logger.error(
          `Account for ${email} locked due to too many failed OTP attempts.`
        ); // Log account locked
        throw new UnauthorizedException(
          `Too many failed OTP attempts. This email has been temporarily locked. Please try again after ${
            otpLockDurationSeconds / 60
          } minutes.`
        );
      } else {
        this.logger.warn(
          `Incorrect OTP for ${email}. ${attemptsLeft} attempt(s) left.`
        ); // Log incorrect OTP
        throw new UnauthorizedException(
          `Incorrect OTP. You have ${attemptsLeft} attempt(s) left.`
        );
      }
    } else {
      this.logger.log(`OTP successfully validated for ${email}.`); // Log successful validation
      // On successful validation, immediately delete the OTP to prevent reuse
      await this.redisService.del(otpKey);
      // Reset failed attempts on successful validation
      await this.redisService.del(`${RedisKeys.OTP_FAILED_ATTEMPTS}${email}`);
    }

    return isValid;
  }

  async issueSessionToken(
    email: string
  ): Promise<{ accessToken: string }> {
    const payload = { sub: email, type: 'user', jti: uuidv4() };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto
  ): Promise<{ accessToken: string }> {
    const { email, otp } = verifyOtpDto;

    await this.validateOtp(email, otp);

    return this.issueSessionToken(email);
  }
}
