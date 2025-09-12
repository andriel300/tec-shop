// Updated JWT Strategy with cookie support
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RedisService } from '../../redis/redis.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          // Also check for token in cookies
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecret',
      passReqToCallback: false,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    jti: string;
    tenantId?: string;
    roles: string[];
  }): Promise<any> {
    // Check if token is blacklisted
    const isBlacklisted = await this.redisService.get(
      `blacklist:${payload.jti}`
    );

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted.');
    }

    // Get user from database
    const user = await this.authService.findUserById({
      id: payload.sub,
      email: payload.email,
    });

    // Return user object that will be attached to request
    return {
      ...user,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };
  }
}
