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
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie (secure method)
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: AuthJwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      userType: payload.userType
    };
  }
}
