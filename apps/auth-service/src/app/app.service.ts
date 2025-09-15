import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  constructor(private jwtService: JwtService) {}
  login(credential: LoginDto) {
    // for demo: hardcore user, replace with DB logic in production
    if (
      credential.email === 'test@example.com' &&
      credential.password === 'Str0ngP@ssw0rd!'
    ) {
      const payload = { sub: '123', email: credential.email, role: 'admin' };

      const token = this.jwtService.sign(payload);
      return {
        access_token: token,
      };
    }
    throw new UnauthorizedException('Credentials are not valid');
  }
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
