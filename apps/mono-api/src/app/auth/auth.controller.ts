import {
  Body,
  Controller,
  Delete,
  Logger,
  Post,
  Get,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { Throttle } from '@nestjs/throttler';
import type { Response, Request, CookieOptions } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';

import { AuthCoreService } from './auth-core.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthTotpService } from './auth-totp.service';

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
    private readonly authCore: AuthCoreService,
    private readonly authRegistration: AuthRegistrationService,
    private readonly authTotp: AuthTotpService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieConfig(
    userType: UserType,
    tokenType: TokenType,
    isRememberMe: boolean
  ): CookieConfig {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    const accessTokenMaxAge = 15 * 60 * 1000;
    const refreshTokenMaxAge = isRememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    const cookieName = isProduction
      ? `__Host-${userType}_${tokenType}_token`
      : `${userType}_${tokenType}_token`;

    const cookiePath = '/';

    return {
      name: cookieName,
      options: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: tokenType === 'access' ? accessTokenMaxAge : refreshTokenMaxAge,
        path: cookiePath,
      },
    };
  }

  @Post('signup')
  @Throttle({ medium: { limit: 3, ttl: 900000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registration initiated. Check email for OTP.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async signup(@Body() signupDto: SignupDto) {
    return await this.authRegistration.signup(signupDto);
  }

  @Post('verify-email')
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({ status: 201, description: 'Email successfully verified.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authRegistration.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Log in a customer user' })
  @ApiResponse({ status: 201, description: 'Customer successfully logged in. Tokens set as httpOnly cookies.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authCore.login(body);

    const accessCookie = this.getCookieConfig('customer', 'access', result.rememberMe);
    const refreshCookie = this.getCookieConfig('customer', 'refresh', result.rememberMe);

    response.cookie(accessCookie.name, result.access_token, accessCookie.options);
    response.cookie(refreshCookie.name, result.refresh_token, refreshCookie.options);

    return { message: 'Login successful', userType: 'customer' };
  }

  @Post('refresh')
  @Throttle({ medium: { limit: 20, ttl: 900000 } })
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 201, description: 'Access token successfully refreshed.' })
  @ApiResponse({ status: 401, description: 'Authentication failed.' })
  async refreshToken(
    @Body() body: RefreshTokenBodyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const prefix = isProduction ? '__Host-' : '';

    let refreshToken: string | undefined;
    let userType: UserType;

    if (body?.userType && ['customer', 'seller', 'admin'].includes(body.userType)) {
      userType = body.userType;
      refreshToken = request.cookies?.[`${prefix}${userType}_refresh_token`];
    } else {
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

    const currentAccessToken =
      request.cookies?.[`${prefix}${userType}_access_token`] ||
      request.cookies?.access_token;

    const result = await this.authCore.refreshToken(refreshToken, currentAccessToken);

    const accessCookie = this.getCookieConfig(userType, 'access', result.rememberMe);
    const refreshCookie = this.getCookieConfig(userType, 'refresh', result.rememberMe);

    response.cookie(accessCookie.name, result.access_token, accessCookie.options);
    response.cookie(refreshCookie.name, result.refresh_token, refreshCookie.options);

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
  @ApiResponse({ status: 201, description: 'User successfully logged out.' })
  async logout(
    @Req() request: Request & { user: { userId: string; userType?: string } },
    @Res({ passthrough: true }) response: Response
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const prefix = isProduction ? '__Host-' : '';

    try {
      const customerAccessToken = request.cookies?.[`${prefix}customer_access_token`];
      const sellerAccessToken = request.cookies?.[`${prefix}seller_access_token`];
      const adminAccessToken = request.cookies?.[`${prefix}admin_access_token`];
      const accessToken = customerAccessToken || sellerAccessToken || adminAccessToken || request.cookies?.access_token;

      if (accessToken) {
        await this.authCore.revokeToken(accessToken, 'logout');
      }
      await this.authCore.revokeRefreshToken(request.user.userId);
    } catch (error) {
      this.logger.error('Failed to revoke tokens', error);
    }

    const customerAccessCookie = this.getCookieConfig('customer', 'access', false);
    const customerRefreshCookie = this.getCookieConfig('customer', 'refresh', false);
    response.clearCookie(customerAccessCookie.name, customerAccessCookie.options);
    response.clearCookie(customerRefreshCookie.name, customerRefreshCookie.options);

    const sellerAccessCookie = this.getCookieConfig('seller', 'access', false);
    const sellerRefreshCookie = this.getCookieConfig('seller', 'refresh', false);
    response.clearCookie(sellerAccessCookie.name, sellerAccessCookie.options);
    response.clearCookie(sellerRefreshCookie.name, sellerRefreshCookie.options);

    const adminAccessCookie = this.getCookieConfig('admin', 'access', false);
    const adminRefreshCookie = this.getCookieConfig('admin', 'refresh', false);
    response.clearCookie(adminAccessCookie.name, adminAccessCookie.options);
    response.clearCookie(adminRefreshCookie.name, adminRefreshCookie.options);

    response.clearCookie('access_token', { httpOnly: true, secure: isProduction, sameSite: 'strict' });
    response.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: 'strict', path: '/' });

    return { message: 'Logout successful' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 201, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect or user not authenticated.' })
  async changePassword(
    @Req() request: Request & { user: { userId: string } },
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return await this.authCore.changePassword(request.user.userId, changePasswordDto);
  }

  @Post('forgot-password')
  @Throttle({ medium: { limit: 3, ttl: 900000 } })
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 201, description: 'Password reset email sent if account exists.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authRegistration.forgotPassword(forgotPasswordDto);
  }

  @Post('validate-reset-token')
  @Throttle({ medium: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiResponse({ status: 201, description: 'Token is valid, returns user email.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token.' })
  async validateResetToken(@Body() validateResetTokenDto: ValidateResetTokenDto) {
    return await this.authRegistration.validateResetToken(validateResetTokenDto);
  }

  @Post('reset-password')
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 201, description: 'Password successfully reset.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authRegistration.resetPassword(resetPasswordDto);
  }

  // Seller Authentication Endpoints
  @Post('seller/signup')
  @Throttle({ medium: { limit: 3, ttl: 900000 } })
  @ApiOperation({ summary: 'Register a new seller' })
  @ApiResponse({ status: 201, description: 'Seller registration initiated. Check email for OTP.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async sellerSignup(@Body() sellerSignupDto: SellerSignupDto) {
    return await this.authRegistration.sellerSignup(sellerSignupDto);
  }

  @Post('seller/verify-email')
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Verify seller email with OTP' })
  @ApiResponse({ status: 201, description: 'Seller email successfully verified.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifySellerEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authRegistration.verifySellerEmail(verifyEmailDto);
  }

  @Post('seller/login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Log in a seller user' })
  @ApiResponse({ status: 201, description: 'Seller successfully logged in. Tokens set as httpOnly cookies.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async sellerLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authCore.sellerLogin(body);

    const accessCookie = this.getCookieConfig('seller', 'access', result.rememberMe);
    const refreshCookie = this.getCookieConfig('seller', 'refresh', result.rememberMe);

    response.cookie(accessCookie.name, result.access_token, accessCookie.options);
    response.cookie(refreshCookie.name, result.refresh_token, refreshCookie.options);

    return { message: 'Seller login successful', userType: 'seller' };
  }

  @Post('admin/login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Log in an admin user' })
  @ApiResponse({ status: 201, description: 'Admin successfully logged in. Tokens set as httpOnly cookies.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async adminLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authCore.adminLogin(body);

    if (result.requiresTotp) {
      return { requiresTotp: true, tempToken: result.tempToken };
    }

    const accessCookie = this.getCookieConfig('admin', 'access', result.rememberMe);
    const refreshCookie = this.getCookieConfig('admin', 'refresh', result.rememberMe);

    response.cookie(accessCookie.name, result.access_token, accessCookie.options);
    response.cookie(refreshCookie.name, result.refresh_token, refreshCookie.options);

    return { message: 'Admin login successful', userType: 'admin' };
  }

  @Post('admin/totp/verify')
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Complete admin login step 2 — verify TOTP code' })
  @ApiResponse({ status: 201, description: 'TOTP verified. Tokens set as httpOnly cookies.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code.' })
  async adminTotpVerify(
    @Body() body: TotpVerifyDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authCore.completeTotpLogin(body.tempToken, body.code);

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
    return this.authTotp.setupTotp(request.user.userId);
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
    return this.authTotp.enableTotp(request.user.userId, dto.token);
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
    return this.authTotp.disableTotp(request.user.userId, dto.token);
  }

  @Get('admin/totp/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get TOTP status for admin account' })
  @ApiResponse({ status: 200, description: 'Returns TOTP enabled status and backup code count.' })
  async adminTotpStatus(
    @Req() request: Request & { user: { userId: string } }
  ) {
    return this.authTotp.getTotpStatus(request.user.userId);
  }

  @Post('seller/upgrade')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 3, ttl: 900000 } })
  @ApiOperation({ summary: 'Upgrade a customer account to seller' })
  @ApiResponse({ status: 201, description: 'Account upgraded to seller successfully.' })
  @ApiResponse({ status: 400, description: 'Account is not a customer or invalid data.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  async upgradeToSeller(
    @Req() request: Request & { user: { userId: string } },
    @Body() upgradeDto: UpgradeToSellerDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authCore.upgradeToSeller(request.user.userId, upgradeDto);

    const customerAccessCookie = this.getCookieConfig('customer', 'access', false);
    const customerRefreshCookie = this.getCookieConfig('customer', 'refresh', false);
    response.clearCookie(customerAccessCookie.name, customerAccessCookie.options);
    response.clearCookie(customerRefreshCookie.name, customerRefreshCookie.options);

    const sellerAccessCookie = this.getCookieConfig('seller', 'access', false);
    const sellerRefreshCookie = this.getCookieConfig('seller', 'refresh', false);
    response.cookie(sellerAccessCookie.name, result.access_token, sellerAccessCookie.options);
    response.cookie(sellerRefreshCookie.name, result.refresh_token, sellerRefreshCookie.options);

    return { message: 'Account upgraded to seller', userType: 'seller' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @Throttle({ medium: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth consent screen' })
  googleAuth() {
    // Guard handles the redirect to Google OAuth consent screen
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Throttle({ medium: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with authentication cookies set' })
  async googleAuthCallback(
    @Req() request: Request & { user: Record<string, unknown> },
    @Res({ passthrough: true }) response: Response
  ) {
    const googleUser = request.user as {
      googleId: string;
      email: string;
      name: string;
      picture?: string;
    };

    const googleAuthDto: GoogleAuthDto = {
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      userType: 'CUSTOMER',
    };

    const result = await this.authCore.googleLogin(googleAuthDto);

    const userType: UserType = 'customer';

    const accessCookie = this.getCookieConfig(userType, 'access', false);
    const refreshCookie = this.getCookieConfig(userType, 'refresh', false);

    response.cookie(accessCookie.name, result.access_token, accessCookie.options);
    response.cookie(refreshCookie.name, result.refresh_token, refreshCookie.options);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new InternalServerErrorException('FRONTEND_URL is not configured');
    }
    response.redirect(`${frontendUrl}?auth=success`);
  }
}
