import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'] as string;
    if (!authHeader) throw new UnauthorizedException('missing token!');
    const token = authHeader.split(' ')[1];

    const result = await firstValueFrom(
      this.authClient.send('validate-token', token)
    );

    if (!result.valid) throw new UnauthorizedException('invalid token!');

    req.user = { userId: result.userId, role: result.role };
    return true;
  }
}
