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
  Response,
  Headers,
} from '@nestjs/common';

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
import { SignupUserDto } from './dto/signup-user.dto';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { ConfigService } from '@nestjs/config';

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
    @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiBody({ type: SignupUserDto })
  @ApiResponse({
    status: 201,
    description:
      'An OTP has been sent to your email. Please verify to complete registration.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async signup(@Body() signupUserDto: SignupUserDto) {
    return this.authService.signup(signupUserDto);
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
    @Headers('authorization') authorization: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    const token = authorization ? authorization.split(' ')[1] : undefined;
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

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Auth service is healthy.' })
  getHealth(): { status: string } {
    return { status: 'Auth service is healthy' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile (Auth0 JWT required)' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@Req() req: Request) {
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
  async googleAuthRedirect(@Req() req: { user: any }, @Res() res: Response) {
    try {
      // Generate tokens for the Google user
      const accessTokenPayload = {
        sub: req.user.id,
        email: req.user.email,
        jti: uuidv4(),
        tenantId: req.user.tenantId,
        roles: req.user.roles,
      };

      const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRATION',
          '15m'
        ),
      });

      const refreshTokenPayload = { sub: req.user.id, jti: uuidv4() };
      const refreshToken = await this.jwtService.signAsync(
        refreshTokenPayload,
        {
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION',
            '7d'
          ),
        }
      );

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      // Store refresh token in database
      await this.prisma.users.update({
        where: { id: req.user.id },
        data: { refreshToken: hashedRefreshToken },
      });

      // Set cookies
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

      // Redirect to frontend success page
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/success?provider=google`);
    } catch (error) {
      // Redirect to frontend error page
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/error?error=oauth_failed`);
    }
  } // --- OTP Login Flow ---

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
