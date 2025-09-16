import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('auth-signup')
  async signup(@Payload() signupDto: SignupDto) {
    return this.appService.signup(signupDto);
  }

  @MessagePattern('auth-login')
  async login(@Payload() credential: LoginDto) {
    return this.appService.login(credential);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() token: string) {
    return this.appService.validateToken(token);
  }
}
