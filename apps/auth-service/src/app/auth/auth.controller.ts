import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
// Throttle decorators removed - rate limiting handled at API Gateway
import { LoginDto, SignupDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResetPasswordWithCodeDto, ValidateResetTokenDto } from '@tec-shop/dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth-signup')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async signup(@Payload() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @MessagePattern('auth-verify-email')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async verifyEmail(@Payload() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @MessagePattern('auth-login')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async login(@Payload() credential: LoginDto) {
    return this.authService.login(credential);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() token: string) {
    return this.authService.validateToken(token);
  }

  @MessagePattern('auth-refresh-token')
  // Rate limiting handled at API Gateway level
  async refreshToken(@Payload() payload: { refreshToken: string; currentAccessToken?: string }) {
    return this.authService.refreshToken(payload.refreshToken, payload.currentAccessToken);
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
  async validateResetToken(@Payload() validateResetTokenDto: ValidateResetTokenDto) {
    return this.authService.validateResetToken(validateResetTokenDto);
  }

  @MessagePattern('auth-reset-password')
  // Throttle decorator removed - rate limiting handled at API Gateway
  async resetPassword(@Payload() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @MessagePattern('auth-reset-password-with-code')
  // Legacy endpoint for backward compatibility
  async resetPasswordWithCode(@Payload() resetPasswordDto: ResetPasswordWithCodeDto) {
    return this.authService.resetPasswordWithCode(resetPasswordDto);
  }
}
