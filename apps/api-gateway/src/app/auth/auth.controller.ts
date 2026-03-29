import {
  Body,
  Controller,
  Delete,
  Inject,
  Logger,
  Post,
  Get,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
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
  ChangePasswordDto,
  UpgradeToSellerDto,
  TotpVerifyDto,
  TotpEnableDto,
  TotpDisableDto,
} from '@tec-shop/dto';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request, CookieOptions } from 'express';
import { JwtAuthGuard, GoogleAuthGuard } from '../../guards/auth';

type UserType = 'customer' | 'seller' | 'admin';
type TokenType = 'access' | 'refresh';

class RefreshTokenBodyDto {
  @IsOptional()
  @IsString()
  @IsIn(['customer', 'seller', 'admin'])
  userType?: UserType;
}

interface CookieConfig {
  name: string;
  options: CookieOptions;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    private readonly configService: ConfigService,
    private readonly cb: CircuitBreakerService
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
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Access token is always 15 minutes (short-lived); rememberMe only extends the refresh token
    const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes

    const refreshTokenMaxAge = isRememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000; // 7 days for normal session

    // Cookie naming with __Host- prefix in production for enhanced security
    // __Host- prefix enforces: secure=true, no domain attribute, path must be /
    const cookieName = isProduction
      ? `__Host-${userType}_${tokenType}_token`
      : `${userType}_${tokenType}_token`;

    // Path must be / to allow cookies to be sent with:
    // 1. API endpoints (/api/auth/*, /api/customer/*, /api/seller/*)
    // 2. Page routes (/, /profile, etc.) - required for Next.js middleware
    // Cookie names provide isolation (customer_access_token vs seller_access_token)
    const cookiePath = '/';

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
  async signup(@Body() signupDto: SignupDto) {
    return await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-signup', signupDto)
    ));
  }

  @Post('verify-email')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({ status: 201, description: 'Email successfully verified.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-verify-email', verifyEmailDto)
    ));
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
    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-login', body)
    ));

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
  @Throttle({ medium: { limit: 20, ttl: 900000 } }) // 20 refreshes per 15 min — safe with singleton interceptor
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 201,
    description: 'Access token successfully refreshed.',
  })
  @ApiResponse({ status: 401, description: 'Authentication failed.' })
  async refreshToken(
    @Body() body: RefreshTokenBodyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const prefix = isProduction ? '__Host-' : '';

    // If the caller specifies userType, use only that cookie to avoid
    // cross-app token conflicts when multiple apps share localhost cookies.
    let refreshToken: string | undefined;
    let userType: UserType;

    if (body?.userType && ['customer', 'seller', 'admin'].includes(body.userType)) {
      userType = body.userType;
      refreshToken = request.cookies?.[`${prefix}${userType}_refresh_token`];
    } else {
      // Fallback: guess by priority (backward compat / legacy cookie)
      const customerRefreshToken = request.cookies?.[`${prefix}customer_refresh_token`];
      const sellerRefreshToken   = request.cookies?.[`${prefix}seller_refresh_token`];
      const adminRefreshToken    = request.cookies?.[`${prefix}admin_refresh_token`];
      const legacyRefreshToken   = request.cookies?.refresh_token;

      refreshToken = customerRefreshToken || sellerRefreshToken || adminRefreshToken || legacyRefreshToken;
      userType = customerRefreshToken ? 'customer' : sellerRefreshToken ? 'seller' : 'admin';
    }

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found. Please log in again.');
    }

    // Get current access token for validation
    const currentAccessToken =
      request.cookies?.[`${prefix}${userType}_access_token`] ||
      request.cookies?.access_token;

    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-refresh-token', {
        refreshToken,
        currentAccessToken,
      })
    ));

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
      user: {
        id: result.userId,
        email: result.email,
        name: result.name,
        createdAt: result.createdAt,
      },
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
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const prefix = isProduction ? '__Host-' : '';

    try {
      // Get access token from cookies
      const customerAccessToken =
        request.cookies?.[`${prefix}customer_access_token`];
      const sellerAccessToken =
        request.cookies?.[`${prefix}seller_access_token`];
      const adminAccessToken =
        request.cookies?.[`${prefix}admin_access_token`];
      const accessToken =
        customerAccessToken ||
        sellerAccessToken ||
        adminAccessToken ||
        request.cookies?.access_token;

      // Revoke the current access token (Security Hardened)
      if (accessToken) {
        await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
          this.authService.send('auth-revoke-token', {
            token: accessToken,
            reason: 'logout',
          })
        ));
      }

      // Revoke the refresh token in the database
      await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
        this.authService.send('auth-revoke-refresh-token', request.user.userId)
      ));
    } catch (error) {
      this.logger.error('Failed to revoke tokens', error);
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
    const sellerRefreshCookie = this.getCookieConfig('seller', 'refresh', false);
    response.clearCookie(sellerAccessCookie.name, sellerAccessCookie.options);
    response.clearCookie(sellerRefreshCookie.name, sellerRefreshCookie.options);

    // Admin cookies
    const adminAccessCookie = this.getCookieConfig('admin', 'access', false);
    const adminRefreshCookie = this.getCookieConfig('admin', 'refresh', false);
    response.clearCookie(adminAccessCookie.name, adminAccessCookie.options);
    response.clearCookie(adminRefreshCookie.name, adminRefreshCookie.options);

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
      path: '/',
    });

    return { message: 'Logout successful' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 201,
    description: 'Password changed successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect or user not authenticated.' })
  async changePassword(
    @Req() request: Request & { user: { userId: string } },
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-change-password', {
        userId: request.user.userId,
        changePasswordDto,
      })
    ));
    return result;
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
    return await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-forgot-password', forgotPasswordDto)
    ));
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
    return await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-validate-reset-token', validateResetTokenDto)
    ));
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
    return await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-reset-password', resetPasswordDto)
    ));
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
  async sellerSignup(@Body() sellerSignupDto: SellerSignupDto) {
    return await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('seller-auth-signup', sellerSignupDto)
    ));
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
    return await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('seller-auth-verify-email', verifyEmailDto)
    ));
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
    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('seller-auth-login', body)
    ));

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

  @Post('admin/login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 login attempts per 15 minutes
  @ApiOperation({ summary: 'Log in an admin user' })
  @ApiResponse({
    status: 201,
    description:
      'Admin successfully logged in. Tokens set as httpOnly cookies.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async adminLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('admin-auth-login', body)
    ));

    // When TOTP is enabled, step 1 returns a partial-auth token instead of full tokens.
    // The client must POST to /auth/admin/totp/verify to complete login.
    if (result.requiresTotp) {
      return { requiresTotp: true, tempToken: result.tempToken };
    }

    // Get cookie configurations with proper isolation and security
    const accessCookie = this.getCookieConfig(
      'admin',
      'access',
      result.rememberMe
    );
    const refreshCookie = this.getCookieConfig(
      'admin',
      'refresh',
      result.rememberMe
    );

    // Set cookies for admin authentication
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
    return {
      message: 'Admin login successful',
      userType: 'admin',
    };
  }

  @Post('admin/totp/verify')
  @Throttle({ medium: { limit: 5, ttl: 60000 } }) // 5 attempts per minute — TOTP brute-force protection
  @ApiOperation({ summary: 'Complete admin login step 2 — verify TOTP code' })
  @ApiResponse({ status: 201, description: 'TOTP verified. Tokens set as httpOnly cookies.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code.' })
  async adminTotpVerify(
    @Body() body: TotpVerifyDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('admin-totp-verify', body)
    ));

    const accessCookie = this.getCookieConfig('admin', 'access', false);
    const refreshCookie = this.getCookieConfig('admin', 'refresh', false);
    response.cookie(accessCookie.name, result.access_token, accessCookie.options);
    response.cookie(refreshCookie.name, result.refresh_token, refreshCookie.options);

    return { message: 'Admin login successful', userType: 'admin' };
  }

  @Post('admin/totp/setup')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Initiate TOTP setup for admin account' })
  @ApiResponse({ status: 201, description: 'Returns QR code URL, plain secret, and backup codes.' })
  async adminTotpSetup(
    @Req() request: Request & { user: { userId: string } }
  ) {
    return this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('admin-totp-setup', { userId: request.user.userId })
    ));
  }

  @Post('admin/totp/enable')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirm first TOTP code and activate TOTP' })
  @ApiResponse({ status: 201, description: 'TOTP enabled successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid TOTP code.' })
  async adminTotpEnable(
    @Req() request: Request & { user: { userId: string } },
    @Body() dto: TotpEnableDto
  ) {
    return this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('admin-totp-enable', { userId: request.user.userId, dto })
    ));
  }

  @Delete('admin/totp')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Disable TOTP for admin account' })
  @ApiResponse({ status: 200, description: 'TOTP disabled successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid TOTP code.' })
  async adminTotpDisable(
    @Req() request: Request & { user: { userId: string } },
    @Body() dto: TotpDisableDto
  ) {
    return this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('admin-totp-disable', { userId: request.user.userId, dto })
    ));
  }

  @Get('admin/totp/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get TOTP status for admin account' })
  @ApiResponse({ status: 200, description: 'Returns TOTP enabled status and backup code count.' })
  async adminTotpStatus(
    @Req() request: Request & { user: { userId: string } }
  ) {
    return this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('admin-totp-status', { userId: request.user.userId })
    ));
  }

  @Post('seller/upgrade')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 3, ttl: 900000 } }) // 3 upgrade attempts per 15 minutes
  @ApiOperation({ summary: 'Upgrade a customer account to seller' })
  @ApiResponse({ status: 201, description: 'Account upgraded to seller successfully.' })
  @ApiResponse({ status: 400, description: 'Account is not a customer or invalid data.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  async upgradeToSeller(
    @Req() request: Request & { user: { userId: string } },
    @Body() upgradeDto: UpgradeToSellerDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-upgrade-to-seller', {
        userId: request.user.userId,
        upgradeDto,
      })
    ));

    // Clear customer cookies
    const customerAccessCookie = this.getCookieConfig('customer', 'access', false);
    const customerRefreshCookie = this.getCookieConfig('customer', 'refresh', false);
    response.clearCookie(customerAccessCookie.name, customerAccessCookie.options);
    response.clearCookie(customerRefreshCookie.name, customerRefreshCookie.options);

    // Set seller cookies
    const sellerAccessCookie = this.getCookieConfig('seller', 'access', false);
    const sellerRefreshCookie = this.getCookieConfig('seller', 'refresh', false);
    response.cookie(sellerAccessCookie.name, result.access_token, sellerAccessCookie.options);
    response.cookie(sellerRefreshCookie.name, result.refresh_token, sellerRefreshCookie.options);

    return { message: 'Account upgraded to seller', userType: 'seller' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @Throttle({ medium: { limit: 10, ttl: 900000 } }) // 10 OAuth initiations per 15 minutes
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth consent screen',
  })
  googleAuth() {
    // Guard handles the redirect to Google OAuth consent screen
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Throttle({ medium: { limit: 10, ttl: 900000 } }) // 10 OAuth callbacks per 15 minutes
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
    const result = await this.cb.fire('AUTH_SERVICE', () => firstValueFrom(
      this.authService.send('auth-google-login', googleAuthDto)
    ));

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

    // Redirect to frontend — tokens are already in httpOnly cookies above.
    // Do NOT pass user data in the URL (browser history, server logs, Referer header leakage).
    // The frontend will call /auth/refresh to retrieve user identity from the session cookie.
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new InternalServerErrorException('FRONTEND_URL is not configured');
    }
    response.redirect(`${frontendUrl}?auth=success`);
  }
}
