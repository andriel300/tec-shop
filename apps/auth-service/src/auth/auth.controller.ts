import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerOptions } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

const registerThrottleOptions: ThrottlerOptions = { limit: 3, ttl: 60000 };
const loginThrottleOptions: ThrottlerOptions = { limit: 3, ttl: 60000 };
const generateOtpThrottleOptions: ThrottlerOptions = { limit: 3, ttl: 60000 };
const requestPasswordResetThrottleOptions: ThrottlerOptions = {
  limit: 3,
  ttl: 60000,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(registerThrottleOptions as any)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: 201,
    description:
      'An OTP has been sent to your email. Please verify to complete registration.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email and create user' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified, user created, access token returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (e.g., invalid or expired OTP).',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid input).',
  })
  async verifyEmail(
    @Body() body: VerifyEmailDto
  ): Promise<{ accessToken: string }> {
    return this.authService.verifyEmail(body);
  }

  @Throttle(loginThrottleOptions as any)
  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful, access token returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (e.g., invalid credentials).',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'lax', // Or 'Strict'
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'lax', // Or 'Strict'
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      path: '/',
    });

    return { message: 'Login successful!' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Access token and refresh token refreshed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (e.g., invalid or expired refresh token).',
  })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      body.refreshToken
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      path: '/',
    });

    return { message: 'Tokens refreshed successfully.' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    const token = req.headers.authorization
      ? req.headers.authorization.split(' ')[1]
      : undefined;
    const result = await this.authService.logout(token as string); // Explicitly cast to string

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return result;
  }

  @Get()
  getHelloApi(): { message: string } {
    return {
      message: 'Hello andriel hehe just testing this new api right? hehe',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile (Auth0 JWT required)' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@Req() req: ExpressRequest) {
    return req.user;
  }

  // --- Google OAuth Flow ---

  @Get('login/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google for authentication.',
  })
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleAuthRedirect(@Req() req: any) {
    return this.authService.googleLogin(req.user);
  }

  // --- OTP Login Flow ---

  @Throttle(generateOtpThrottleOptions as any)
  @Post('otp/generate')
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

  @Post('otp/verify')
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

  @Throttle(requestPasswordResetThrottleOptions as any)
  @Post('password/request-reset')
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

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password has been reset successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid input).',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (e.g., invalid or expired token).',
  })
  async resetPassword(
    @Body() body: ResetPasswordDto
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(body);
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin-only endpoint' })
  @ApiResponse({ status: 200, description: 'Access granted to admin.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getAdminData(@Req() req: ExpressRequest) {
    return { message: 'Welcome, admin!', user: req.user };
  }
}
