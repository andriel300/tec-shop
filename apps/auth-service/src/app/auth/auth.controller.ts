import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, SignupDto, VerifyEmailDto } from '@tec-shop/shared/dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth-signup')
  async signup(@Payload() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @MessagePattern('auth-verify-email')
  async verifyEmail(@Payload() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @MessagePattern('auth-login')
  async login(@Payload() credential: LoginDto) {
    return this.authService.login(credential);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() token: string) {
    return this.authService.validateToken(token);
  }
}
