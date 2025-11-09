import {
  Body,
  Controller,
  Inject,
  Post,
  Get,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type {
  LoginDto,
  SignupDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ValidateResetTokenDto,
  SellerSignupDto,
  GoogleAuthDto,
} from '@tec-shop/dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request, CookieOptions } from 'express';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { GoogleAuthGuard } from '../../guards/auth/google-auth.guard';

type UserType = 'customer' | 'seller';
type TokenType = 'access' | 'refresh';

interface CookieConfig {
  name: string;
  options: CookieOptions;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy
  ) {}

  /**
   * Get secure cookie configuration with path isolation and proper naming
   * Uses __Host- prefix in production for additional security
   */
  private getCookieConfig(
    userType: UserType,
    tokenType: TokenType,
    isRememberMe: boolean
  ): CookieConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    // Calculate expiration times based on remember me preference
    const accessTokenMaxAge = isRememberMe
      ? 7 * 24 * 60 * 60 * 1000 // 7 days for remember me
      : 24 * 60 * 60 * 1000; // 24 hours for normal session

    const refreshTokenMaxAge = isRememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000; // 7 days for normal session

    // Cookie naming with __Host- prefix in production for enhanced security
    // __Host- prefix enforces: secure=true, no domain attribute, path must be /
    const cookieName = isProduction
      ? `__Host-${userType}_${tokenType}_token`
      : `${userType}_${tokenType}_token`;

    // Path must be /api to cover both auth endpoints (/api/auth/*) and resource endpoints (/api/customer/*, /api/seller/*)
    // More restrictive paths would prevent cookies from being sent to auth endpoints
    // Cookie names provide isolation instead (customer_access_token vs seller_access_token)
    const cookiePath = '/api';

    return {
      name: cookieName,
      options: {
        httpOnly: true, // Prevent XSS attacks - JavaScript cannot access
        secure: isProduction, // HTTPS only in production (__Host- requires this)
        sameSite: 'strict', // CSRF protection - cookie only sent to same site
        maxAge: tokenType === 'access' ? accessTokenMaxAge : refreshTokenMaxAge,
        path: cookiePath,
        // Note: Cookie isolation achieved via unique names (customer_* vs seller_*) rather than path
      },
    };
  }

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
  @ApiOperation({ summary: 'Log in a customer user' })
  @ApiResponse({
    status: 201,
    description:
      'Customer successfully logged in. Tokens set as httpOnly cookies.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await firstValueFrom(
      this.authService.send('auth-login', body)
    );

    // Get cookie configurations with proper isolation and security
    const accessCookie = this.getCookieConfig(
      'customer',
      'access',
      result.rememberMe
    );
    const refreshCookie = this.getCookieConfig(
      'customer',
      'refresh',
      result.rememberMe
    );

    // Set cookies with path isolation (/api/customer/*)
    response.cookie(
      accessCookie.name,
      result.access_token,
      accessCookie.options
    );
    response.cookie(
      refreshCookie.name,
      result.refresh_token,
      refreshCookie.options
    );

    // Return success without exposing tokens in response body
    // Include userType to help frontend distinguish between customer and seller
    return {
      message: 'Login successful',
      userType: 'customer',
    };
  }

  @Post('refresh')
  @Throttle({ medium: { limit: 10, ttl: 900000 } }) // 10 refresh attempts per 15 minutes
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 201,
    description: 'Access token successfully refreshed.',
  })
  @ApiResponse({ status: 401, description: 'Authentication failed.' })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const prefix = isProduction ? '__Host-' : '';

    // Try to extract refresh token from customer or seller cookies
    const customerRefreshToken =
      request.cookies?.[`${prefix}customer_refresh_token`];
    const sellerRefreshToken =
      request.cookies?.[`${prefix}seller_refresh_token`];

    // Also try old cookie name for backward compatibility during migration
    const legacyRefreshToken = request.cookies?.refresh_token;

    const refreshToken =
      customerRefreshToken || sellerRefreshToken || legacyRefreshToken;
    const userType: UserType = customerRefreshToken ? 'customer' : 'seller';

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found. Please log in again.');
    }

    // Get current access token for validation
    const currentAccessToken =
      request.cookies?.[`${prefix}${userType}_access_token`] ||
      request.cookies?.access_token;

    const result = await firstValueFrom(
      this.authService.send('auth-refresh-token', {
        refreshToken,
        currentAccessToken,
      })
    );

    // Get cookie configurations with proper isolation
    const accessCookie = this.getCookieConfig(
      userType,
      'access',
      result.rememberMe
    );
    const refreshCookie = this.getCookieConfig(
      userType,
      'refresh',
      result.rememberMe
    );

    // Set new cookies with rotated tokens (security best practice)
    response.cookie(
      accessCookie.name,
      result.access_token,
      accessCookie.options
    );
    response.cookie(
      refreshCookie.name,
      result.refresh_token,
      refreshCookie.options
    );

    return {
      message: 'Token refreshed successfully',
      userType,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Log out a user (customer or seller)' })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged out.',
  })
  async logout(
    @Req() request: Request & { user: { userId: string; userType?: string } },
    @Res({ passthrough: true }) response: Response
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const prefix = isProduction ? '__Host-' : '';

    try {
      // Get access token from cookies
      const customerAccessToken =
        request.cookies?.[`${prefix}customer_access_token`];
      const sellerAccessToken =
        request.cookies?.[`${prefix}seller_access_token`];
      const accessToken =
        customerAccessToken ||
        sellerAccessToken ||
        request.cookies?.access_token;

      // Revoke the current access token (Security Hardened)
      if (accessToken) {
        await firstValueFrom(
          this.authService.send('auth-revoke-token', {
            token: accessToken,
            reason: 'logout',
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

    // Clear all possible cookie variations (for migration compatibility)
    // Customer cookies
    const customerAccessCookie = this.getCookieConfig(
      'customer',
      'access',
      false
    );
    const customerRefreshCookie = this.getCookieConfig(
      'customer',
      'refresh',
      false
    );
    response.clearCookie(
      customerAccessCookie.name,
      customerAccessCookie.options
    );
    response.clearCookie(
      customerRefreshCookie.name,
      customerRefreshCookie.options
    );

    // Seller cookies
    const sellerAccessCookie = this.getCookieConfig('seller', 'access', false);
    const sellerRefreshCookie = this.getCookieConfig(
      'seller',
      'refresh',
      false
    );
    response.clearCookie(sellerAccessCookie.name, sellerAccessCookie.options);
    response.clearCookie(sellerRefreshCookie.name, sellerRefreshCookie.options);

    // Legacy cookies (for backward compatibility during migration)
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
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
  async validateResetToken(
    @Body() validateResetTokenDto: ValidateResetTokenDto
  ) {
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
  @ApiResponse({
    status: 201,
    description: 'Seller email successfully verified.',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifySellerEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await firstValueFrom(
      this.authService.send('seller-auth-verify-email', verifyEmailDto)
    );
  }

  @Post('seller/login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 login attempts per 15 minutes
  @ApiOperation({ summary: 'Log in a seller user' })
  @ApiResponse({
    status: 201,
    description:
      'Seller successfully logged in. Tokens set as httpOnly cookies.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async sellerLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await firstValueFrom(
      this.authService.send('seller-auth-login', body)
    );

    // Get cookie configurations with proper isolation and security
    const accessCookie = this.getCookieConfig(
      'seller',
      'access',
      result.rememberMe
    );
    const refreshCookie = this.getCookieConfig(
      'seller',
      'refresh',
      result.rememberMe
    );

    // Set cookies with path isolation (/api/seller/*)
    response.cookie(
      accessCookie.name,
      result.access_token,
      accessCookie.options
    );
    response.cookie(
      refreshCookie.name,
      result.refresh_token,
      refreshCookie.options
    );

    // Return success without exposing tokens in response body
    // Include userType to help frontend distinguish between customer and seller
    return {
      message: 'Seller login successful',
      userType: 'seller',
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth consent screen',
  })
  async googleAuth() {
    // Guard redirects to Google OAuth consent screen
    // No implementation needed here
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with authentication cookies set',
  })
  async googleAuthCallback(
    @Req() request: Request & { user: Record<string, unknown> },
    @Res({ passthrough: true }) response: Response
  ) {
    // Extract Google user data from request
    const googleUser = request.user as {
      googleId: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Prepare data for auth service
    const googleAuthDto: GoogleAuthDto = {
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      userType: 'CUSTOMER', // Default to customer, can be changed later
    };

    // Send to auth-service to handle user creation/login
    const result = await firstValueFrom(
      this.authService.send('auth-google-login', googleAuthDto)
    );

    // Determine userType from result (defaults to customer)
    const userType: UserType = 'customer';

    // Get cookie configurations with proper isolation and security
    const accessCookie = this.getCookieConfig(
      userType,
      'access',
      false // Google OAuth doesn't use rememberMe
    );
    const refreshCookie = this.getCookieConfig(
      userType,
      'refresh',
      false
    );

    // Set cookies with path isolation
    response.cookie(
      accessCookie.name,
      result.access_token,
      accessCookie.options
    );
    response.cookie(
      refreshCookie.name,
      result.refresh_token,
      refreshCookie.options
    );

    // Redirect to frontend home page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    response.redirect(frontendUrl);
  }
}
