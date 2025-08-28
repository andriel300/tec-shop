import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get()
  getHelloApi(): { message: string } {
    return { message: 'Hello andriel hehe just testing this new api right? hehe' };
  }
}

