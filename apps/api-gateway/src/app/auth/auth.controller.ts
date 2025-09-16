import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return await firstValueFrom(this.authService.send('auth-signup', signupDto));
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await firstValueFrom(this.authService.send('auth-login', body));
  }
}
