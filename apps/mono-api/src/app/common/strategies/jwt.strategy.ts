import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

interface AuthJwtPayload {
  sub: string;
  username: string;
  role: string;
  userType: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET environment variable must be configured and at least 32 characters long.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const isProduction = process.env.NODE_ENV === 'production';
          const prefix = isProduction ? '__Host-' : '';

          const pick = (token: string | undefined): string | null => {
            if (!token) return null;
            try {
              const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64url').toString()
              ) as { exp?: number };
              const expired =
                typeof payload.exp === 'number' &&
                payload.exp < Math.floor(Date.now() / 1000);
              return expired ? null : token;
            } catch {
              return null;
            }
          };

          return (
            pick(request?.cookies?.[`${prefix}customer_access_token`]) ??
            pick(request?.cookies?.[`${prefix}seller_access_token`]) ??
            pick(request?.cookies?.[`${prefix}admin_access_token`]) ??
            pick(request?.cookies?.access_token) ??
            null
          );
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: AuthJwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      userType: payload.userType,
    };
  }
}
