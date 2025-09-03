import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { email, password } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async generateOtp(generateOtpDto: GenerateOtpDto): Promise<{ message: string }> {
    const { email } = generateOtpDto;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;

    await this.redisService.set(otpKey, otp, 300);
    await this.emailService.sendOtp(email, otp);

    return { message: `An OTP has been sent to ${email}. It will expire in 5 minutes.` };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ accessToken: string }> {
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
