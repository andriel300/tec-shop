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
        // Extract from secure httpOnly cookies with proper naming
        (request: Request) => {
          const isProduction = process.env.NODE_ENV === 'production';
          const prefix = isProduction ? '__Host-' : '';

          // Try customer cookies first (most common)
          const customerToken =
            request?.cookies?.[`${prefix}customer_access_token`];
          if (customerToken) return customerToken;

          // Try seller cookies
          const sellerToken =
            request?.cookies?.[`${prefix}seller_access_token`];
          if (sellerToken) return sellerToken;

          // Try admin cookies
          const adminToken =
            request?.cookies?.[`${prefix}admin_access_token`];
          if (adminToken) return adminToken;

          // Fallback to legacy cookie name for backward compatibility during migration
          const legacyToken = request?.cookies?.access_token;
          if (legacyToken) return legacyToken;

          return null;
        },
        // Fallback to Authorization header for API clients and backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: AuthJwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      userType: payload.userType,
    };
  }
}
