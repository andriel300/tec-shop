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
  UpgradeToSellerDto,
  TotpEnableDto,
  TotpDisableDto,
  TotpVerifyDto,
} from '@tec-shop/dto';
import { AuthCoreService } from './auth-core.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthTotpService } from './auth-totp.service';

@Controller()
export class AuthController {
  constructor(
    private readonly authCore: AuthCoreService,
    private readonly authRegistration: AuthRegistrationService,
    private readonly authTotp: AuthTotpService,
  ) {}

  @MessagePattern('auth-signup')
  async signup(@Payload() signupDto: SignupDto) {
    return this.authRegistration.signup(signupDto);
  }

  @MessagePattern('seller-auth-signup')
  async sellerSignup(@Payload() sellerSignupDto: SellerSignupDto) {
    return this.authRegistration.sellerSignup(sellerSignupDto);
  }

  @MessagePattern('auth-verify-email')
  async verifyEmail(@Payload() verifyEmailDto: VerifyEmailDto) {
    return this.authRegistration.verifyEmail(verifyEmailDto);
  }

  @MessagePattern('seller-auth-verify-email')
  async verifySellerEmail(@Payload() verifyEmailDto: VerifyEmailDto) {
    return this.authRegistration.verifySellerEmail(verifyEmailDto);
  }

  @MessagePattern('auth-login')
  async login(@Payload() credential: LoginDto) {
    return this.authCore.login(credential);
  }

  @MessagePattern('admin-auth-login')
  async adminLogin(@Payload() credential: LoginDto) {
    return this.authCore.adminLogin(credential);
  }

  @MessagePattern('seller-auth-login')
  async sellerLogin(@Payload() credential: LoginDto) {
    return this.authCore.sellerLogin(credential);
  }

  @MessagePattern('auth-google-login')
  async googleLogin(@Payload() googleAuthDto: GoogleAuthDto) {
    return this.authCore.googleLogin(googleAuthDto);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() token: string) {
    return this.authCore.validateToken(token);
  }

  @MessagePattern('auth-refresh-token')
  async refreshToken(
    @Payload() payload: { refreshToken: string; currentAccessToken?: string }
  ) {
    return this.authCore.refreshToken(
      payload.refreshToken,
      payload.currentAccessToken
    );
  }

  @MessagePattern('auth-revoke-refresh-token')
  async revokeRefreshToken(@Payload() userId: string) {
    return this.authCore.revokeRefreshToken(userId);
  }

  @MessagePattern('auth-forgot-password')
  async forgotPassword(@Payload() forgotPasswordDto: ForgotPasswordDto) {
    return this.authRegistration.forgotPassword(forgotPasswordDto);
  }

  @MessagePattern('auth-validate-reset-token')
  async validateResetToken(
    @Payload() validateResetTokenDto: ValidateResetTokenDto
  ) {
    return this.authRegistration.validateResetToken(validateResetTokenDto);
  }

  @MessagePattern('auth-reset-password')
  async resetPassword(@Payload() resetPasswordDto: ResetPasswordDto) {
    return this.authRegistration.resetPassword(resetPasswordDto);
  }

  @MessagePattern('auth-reset-password-with-code')
  async resetPasswordWithCode(
    @Payload() resetPasswordDto: ResetPasswordWithCodeDto
  ) {
    return this.authRegistration.resetPasswordWithCode(resetPasswordDto);
  }

  @MessagePattern('auth-revoke-token')
  async revokeToken(@Payload() payload: { token: string; reason?: string }) {
    return this.authCore.revokeToken(payload.token, payload.reason);
  }

  @MessagePattern('auth-revoke-all-user-tokens')
  async revokeAllUserTokens(
    @Payload() payload: { userId: string; reason?: string }
  ) {
    return this.authCore.revokeAllUserTokens(payload.userId, payload.reason);
  }

  @MessagePattern('auth-change-password')
  async changePassword(
    @Payload() payload: { userId: string; changePasswordDto: ChangePasswordDto }
  ) {
    return this.authCore.changePassword(
      payload.userId,
      payload.changePasswordDto
    );
  }

  @MessagePattern('get-user-email')
  async getUserEmail(@Payload() userId: string) {
    return this.authCore.getUserEmail(userId);
  }

  @MessagePattern('auth-upgrade-to-seller')
  async upgradeToSeller(
    @Payload() payload: { userId: string; upgradeDto: UpgradeToSellerDto }
  ) {
    return this.authCore.upgradeToSeller(payload.userId, payload.upgradeDto);
  }

  // TOTP endpoints (admin only)

  @MessagePattern('admin-totp-setup')
  async adminTotpSetup(@Payload() payload: { userId: string }) {
    return this.authTotp.setupTotp(payload.userId);
  }

  @MessagePattern('admin-totp-enable')
  async adminTotpEnable(
    @Payload() payload: { userId: string; dto: TotpEnableDto }
  ) {
    return this.authTotp.enableTotp(payload.userId, payload.dto.token);
  }

  @MessagePattern('admin-totp-verify')
  async adminTotpVerify(@Payload() dto: TotpVerifyDto) {
    return this.authCore.completeTotpLogin(dto.tempToken, dto.code);
  }

  @MessagePattern('admin-totp-disable')
  async adminTotpDisable(
    @Payload() payload: { userId: string; dto: TotpDisableDto }
  ) {
    return this.authTotp.disableTotp(payload.userId, payload.dto.token);
  }

  @MessagePattern('admin-totp-status')
  async adminTotpStatus(@Payload() payload: { userId: string }) {
    return this.authTotp.getTotpStatus(payload.userId);
  }
}
