import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';
import { LoginDto, SignupDto, VerifyEmailDto } from '@tec-shop/dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth-signup')
  @Throttle({ medium: { limit: 3, ttl: 900000 } }) // 3 signups per 15 minutes
  async signup(@Payload() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @MessagePattern('auth-verify-email')
  @Throttle({ medium: { limit: 3, ttl: 900000 } }) // 3 attempts per 15 minutes
  async verifyEmail(@Payload() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @MessagePattern('auth-login')
  @Throttle({ medium: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  async login(@Payload() credential: LoginDto) {
    return this.authService.login(credential);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() token: string) {
    return this.authService.validateToken(token);
  }
}
