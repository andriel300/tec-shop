import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
// Throttle decorators removed - rate limiting handled at API Gateway
import {
  LoginDto,
  SignupDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordWithCodeDto,
  ValidateResetTokenDto,
  SellerSignupDto,
  GoogleAuthDto,
  ChangePasswordDto,
} from '@tec-shop/dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth-signup')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async signup(@Payload() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @MessagePattern('seller-auth-signup')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async sellerSignup(@Payload() sellerSignupDto: SellerSignupDto) {
    return this.authService.sellerSignup(sellerSignupDto);
  }

  @MessagePattern('auth-verify-email')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async verifyEmail(@Payload() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @MessagePattern('seller-auth-verify-email')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async verifySellerEmail(@Payload() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifySellerEmail(verifyEmailDto);
  }

  @MessagePattern('auth-login')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async login(@Payload() credential: LoginDto) {
    return this.authService.login(credential);
  }

  @MessagePattern('admin-auth-login')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async adminLogin(@Payload() credential: LoginDto) {
    return this.authService.login(credential);
  }

  @MessagePattern('seller-auth-login')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async sellerLogin(@Payload() credential: LoginDto) {
    return this.authService.sellerLogin(credential);
  }

  @MessagePattern('auth-google-login')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async googleLogin(@Payload() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleLogin(googleAuthDto);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() token: string) {
    return this.authService.validateToken(token);
  }

  @MessagePattern('auth-refresh-token')
  // Rate limiting handled at API Gateway level
  async refreshToken(
    @Payload() payload: { refreshToken: string; currentAccessToken?: string }
  ) {
    return this.authService.refreshToken(
      payload.refreshToken,
      payload.currentAccessToken
    );
  }

  @MessagePattern('auth-revoke-refresh-token')
  async revokeRefreshToken(@Payload() userId: string) {
    return this.authService.revokeRefreshToken(userId);
  }

  @MessagePattern('auth-forgot-password')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async forgotPassword(@Payload() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @MessagePattern('auth-validate-reset-token')
  async validateResetToken(
    @Payload() validateResetTokenDto: ValidateResetTokenDto
  ) {
    return this.authService.validateResetToken(validateResetTokenDto);
  }

  @MessagePattern('auth-reset-password')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async resetPassword(@Payload() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @MessagePattern('auth-reset-password-with-code')
  // Legacy endpoint for backward compatibility
  async resetPasswordWithCode(
    @Payload() resetPasswordDto: ResetPasswordWithCodeDto
  ) {
    return this.authService.resetPasswordWithCode(resetPasswordDto);
  }

  @MessagePattern('auth-revoke-token')
  async revokeToken(@Payload() payload: { token: string; reason?: string }) {
    return this.authService.revokeToken(payload.token, payload.reason);
  }

  @MessagePattern('auth-revoke-all-user-tokens')
  async revokeAllUserTokens(
    @Payload() payload: { userId: string; reason?: string }
  ) {
    return this.authService.revokeAllUserTokens(payload.userId, payload.reason);
  }

  @MessagePattern('auth-change-password')
  async changePassword(
    @Payload() payload: { userId: string; changePasswordDto: ChangePasswordDto }
  ) {
    return this.authService.changePassword(
      payload.userId,
      payload.changePasswordDto
    );
  }
}
