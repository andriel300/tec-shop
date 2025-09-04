import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return {
      message: 'Hello andriel hehe just testing this new api right? hehe',
    };
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
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid email).',
  })
  async generateOtp(
    @Body() body: GenerateOtpDto
  ): Promise<{ message: string }> {
    return this.authService.generateOtp(body);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access token' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified, access token returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (e.g., invalid or expired OTP).',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid input).',
  })
  async verifyOtp(
    @Body() body: VerifyOtpDto
  ): Promise<{ accessToken: string }> {
    return this.authService.verifyOtp(body);
  }
}
