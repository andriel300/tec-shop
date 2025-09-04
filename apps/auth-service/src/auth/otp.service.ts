import { Injectable, UnauthorizedException } from '@nestjs/common';
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
  ) {}

  async generateOtp(
    generateOtpDto: GenerateOtpDto
  ): Promise<{ message: string }> {
    const { email } = generateOtpDto;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;
    const otpExpirySeconds = this.configService.get<number>('OTP_EXPIRY_SECONDS', 300);

    await this.redisService.set(otpKey, otp, otpExpirySeconds);
    await this.emailService.sendOtp(email, otp);

    return {
      message: `An OTP has been sent to ${email}. It will expire in ${otpExpirySeconds / 60} minutes.`,
    };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto
  ): Promise<{ accessToken: string }> {
    const { email, otp } = verifyOtpDto;
    const otpKey = `otp:${email}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    await this.redisService.del(otpKey);

    const payload = { sub: email, type: 'user' };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
