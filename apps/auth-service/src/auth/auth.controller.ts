import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Get()
  getHelloApi(): { message: string } {
    return { message: 'Hello andriel hehe just testing this new api right? hehe' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile (Auth0 JWT required)' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@Request() req) {
    return req.user;
  }

  // --- OTP Login Flow ---

  @Post('generate-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a One-Time Password (OTP)' })
  @ApiBody({ type: GenerateOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., invalid email).' })
  async generateOtp(@Body() body: GenerateOtpDto): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${body.email}`;

    // Store OTP in Redis with a 5-minute expiry
    await this.redisService.set(otpKey, otp, 300);

    // Send OTP via email
    await this.emailService.sendOtp(body.email, otp);

    return { message: `An OTP has been sent to ${body.email}. It will expire in 5 minutes.` };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access token' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified, access token returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (e.g., invalid or expired OTP).' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., invalid input).' })
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<{ accessToken: string }> {
    const otpKey = `otp:${body.email}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp || storedOtp !== body.otp) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    // OTP is correct, delete it from Redis so it can't be reused
    await this.redisService.del(otpKey);

    // Generate our own JWT for the user's session
    const payload = { sub: body.email, type: 'user' };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
