import { Body, Controller, Inject, Post, Res, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { LoginDto, SignupDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ValidateResetTokenDto, SellerSignupDto } from '@tec-shop/dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy
  ) {}

  @Post('signup')
  @Throttle({ medium: { limit: 3, ttl: 900000 } }) // 3 signups per 15 minutes
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registration initiated. Check email for OTP.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists.',
  })
  async signup(@Body() signupDto: SignupDto) {
    return await firstValueFrom(
      this.authService.send('auth-signup', signupDto)
    );
  }

  @Post('verify-email')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({ status: 201, description: 'Email successfully verified.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await firstValueFrom(
      this.authService.send('auth-verify-email', verifyEmailDto)
    );
  }

  @Post('login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 login attempts per 15 minutes
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged in and returns a JWT token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await firstValueFrom(this.authService.send('auth-login', body));

    // Set secure httpOnly cookies with duration based on rememberMe preference
    const isProduction = process.env.NODE_ENV === 'production';
    const isRememberMe = result.rememberMe;

    // Access token duration based on rememberMe
    const accessTokenMaxAge = isRememberMe
      ? 7 * 24 * 60 * 60 * 1000  // 7 days for remember me
      : 24 * 60 * 60 * 1000;     // 24 hours for normal session

    // Refresh token duration based on rememberMe
    const refreshTokenMaxAge = isRememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000; // 7 days for normal session

    // Access token
    response.cookie('access_token', result.access_token, {
      httpOnly: true,        // Prevent XSS attacks
      secure: isProduction,  // HTTPS only in production
      sameSite: 'strict',    // CSRF protection
      maxAge: accessTokenMaxAge,
    });

    // Refresh token
    response.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,        // Prevent XSS attacks
      secure: isProduction,  // HTTPS only in production
      sameSite: 'strict',    // CSRF protection
      maxAge: refreshTokenMaxAge,
      path: '/api/auth/refresh', // Only sent to refresh endpoint
    });

    // Return success without exposing tokens in response body
    return { message: 'Login successful' };
  }

  @Post('refresh')
  @Throttle({ medium: { limit: 10, ttl: 900000 } }) // 10 refresh attempts per 15 minutes
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 201,
    description: 'Access token successfully refreshed.',
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async refreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refresh_token;
    const currentAccessToken = request.cookies?.access_token;

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const result = await firstValueFrom(
      this.authService.send('auth-refresh-token', { refreshToken, currentAccessToken })
    );

    // Set new secure httpOnly cookies with rotated tokens
    const isProduction = process.env.NODE_ENV === 'production';
    const isRememberMe = result.rememberMe;

    // Determine cookie durations based on remember me preference
    const accessTokenMaxAge = isRememberMe
      ? 7 * 24 * 60 * 60 * 1000  // 7 days for remember me
      : 24 * 60 * 60 * 1000;     // 24 hours for normal session

    const refreshTokenMaxAge = isRememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000; // 7 days for normal session

    // New access token
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessTokenMaxAge,
    });

    // New refresh token (token rotation for security)
    response.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshTokenMaxAge,
      path: '/api/auth/refresh',
    });

    return { message: 'Token refreshed successfully' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Log out a user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged out.',
  })
  async logout(@Req() request: Request & { user: { userId: string } }, @Res({ passthrough: true }) response: Response) {
    try {
      // Get the access token from the request to revoke it
      const accessToken = request.cookies?.access_token;

      // Revoke the current access token (Security Hardened)
      if (accessToken) {
        await firstValueFrom(
          this.authService.send('auth-revoke-token', {
            token: accessToken,
            reason: 'logout'
          })
        );
      }

      // Revoke the refresh token in the database
      await firstValueFrom(
        this.authService.send('auth-revoke-refresh-token', request.user.userId)
      );
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
      // Continue with logout even if revocation fails
    }

    // Clear both authentication cookies
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
    });

    return { message: 'Logout successful' };
  }

  @Post('forgot-password')
  @Throttle({ medium: { limit: 3, ttl: 900000 } }) // 3 reset requests per 15 minutes
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 201,
    description: 'Password reset email sent if account exists.',
  })
  @ApiResponse({ status: 400, description: 'Invalid email format.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await firstValueFrom(
      this.authService.send('auth-forgot-password', forgotPasswordDto)
    );
  }

  @Post('validate-reset-token')
  @Throttle({ medium: { limit: 10, ttl: 900000 } }) // 10 validation attempts per 15 minutes
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiResponse({
    status: 201,
    description: 'Token is valid, returns user email.',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token.' })
  async validateResetToken(@Body() validateResetTokenDto: ValidateResetTokenDto) {
    return await firstValueFrom(
      this.authService.send('auth-validate-reset-token', validateResetTokenDto)
    );
  }

  @Post('reset-password')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 reset attempts per 15 minutes
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 201,
    description: 'Password successfully reset.',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token.' })
  @ApiResponse({ status: 400, description: 'Invalid password format.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await firstValueFrom(
      this.authService.send('auth-reset-password', resetPasswordDto)
    );
  }

  // Seller Authentication Endpoints
  @Post('seller/signup')
  @Throttle({ medium: { limit: 3, ttl: 900000 } }) // 3 signups per 15 minutes
  @ApiOperation({ summary: 'Register a new seller' })
  @ApiResponse({
    status: 201,
    description: 'Seller registration initiated. Check email for OTP.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({
    status: 409,
    description: 'Seller with this email already exists.',
  })
  async sellerSignup(@Body() sellerSignupDto: SellerSignupDto) {
    return await firstValueFrom(
      this.authService.send('seller-auth-signup', sellerSignupDto)
    );
  }

  @Post('seller/verify-email')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'Verify seller email with OTP' })
  @ApiResponse({ status: 201, description: 'Seller email successfully verified.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifySellerEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await firstValueFrom(
      this.authService.send('seller-auth-verify-email', verifyEmailDto)
    );
  }

  @Post('seller/login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 login attempts per 15 minutes
  @ApiOperation({ summary: 'Log in a seller' })
  @ApiResponse({
    status: 201,
    description: 'Seller successfully logged in and returns a JWT token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async sellerLogin(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await firstValueFrom(this.authService.send('seller-auth-login', body));

    // Set secure httpOnly cookies with duration based on rememberMe preference
    const isProduction = process.env.NODE_ENV === 'production';
    const isRememberMe = result.rememberMe;

    // Access token duration based on rememberMe
    const accessTokenMaxAge = isRememberMe
      ? 7 * 24 * 60 * 60 * 1000  // 7 days for remember me
      : 24 * 60 * 60 * 1000;     // 24 hours for normal session

    // Refresh token duration based on rememberMe
    const refreshTokenMaxAge = isRememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000; // 7 days for normal session

    // Access token
    response.cookie('access_token', result.access_token, {
      httpOnly: true,        // Prevent XSS attacks
      secure: isProduction,  // HTTPS only in production
      sameSite: 'strict',    // CSRF protection
      maxAge: accessTokenMaxAge,
    });

    // Refresh token
    response.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,        // Prevent XSS attacks
      secure: isProduction,  // HTTPS only in production
      sameSite: 'strict',    // CSRF protection
      maxAge: refreshTokenMaxAge,
      path: '/api/auth/refresh', // Only sent to refresh endpoint
    });

    // Return success without exposing tokens in response body
    return { message: 'Seller login successful' };
  }
}
