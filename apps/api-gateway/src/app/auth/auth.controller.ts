import { Body, Controller, Inject, Post } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy
  ) {}
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await firstValueFrom(this.authService.send('login', loginDto));
  }
}
