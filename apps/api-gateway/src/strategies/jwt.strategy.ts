import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from '../types/jwt.jwtPayload';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // @ts-expect-error: configService is used in constructor call
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET environment variable must be configured and at least 32 characters long for secure authentication.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from secure httpOnly cookies with proper naming.
        // Skips tokens that are already expired so that a stale cookie from
        // another app on the same localhost domain (e.g. customer_access_token
        // present in the browser while using the seller dashboard) does not
        // shadow a still-valid token of the correct user type.
        (request: Request) => {
          const isProduction = process.env.NODE_ENV === 'production';
          const prefix = isProduction ? '__Host-' : '';

          const pick = (token: string | undefined): string | null => {
            if (!token) return null;
            try {
              // Decode payload without signature verification — passport-jwt
              // still does the full verification. We only check expiry here to
              // avoid passing a stale cross-app cookie ahead of a valid one.
              const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64url').toString()
              ) as { exp?: number };
              const expired =
                typeof payload.exp === 'number' &&
                payload.exp < Math.floor(Date.now() / 1000);
              return expired ? null : token;
            } catch {
              return null; // malformed token — skip it
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
        // Fallback to Authorization header for API clients and backward compatibility
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
