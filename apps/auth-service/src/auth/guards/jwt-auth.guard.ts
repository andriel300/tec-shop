import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();

      // Try to get token from cookies if not in Authorization header
      const cookieToken = request.cookies?.access_token;
      if (cookieToken && !request.headers.authorization) {
        request.headers.authorization = `Bearer ${cookieToken}`;
        return super.canActivate(context);
      }

      throw err || new UnauthorizedException('Invalid or missing token');
    }
    return user;
  }
}
