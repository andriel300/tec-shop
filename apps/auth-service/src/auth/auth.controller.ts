import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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

  // --- Password Reset Flow ---

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent if email exists.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid email).',
  })
  async requestPasswordReset(
    @Body() body: RequestPasswordResetDto
  ): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password has been reset successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., invalid input).', })
  @ApiResponse({ status: 401, description: 'Unauthorized (e.g., invalid or expired token).', })
  async resetPassword(
    @Body() body: ResetPasswordDto
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(body);
  }
}
