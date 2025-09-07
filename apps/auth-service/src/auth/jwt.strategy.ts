import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { RedisService } from '../redis/redis.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies['access_token'];
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecret', // Provide a default or throw an error
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    jti: string;
  }): Promise<any> {
    const isBlacklisted = await this.redisService.get(
      `blacklist:${payload.jti}`
    );

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted.');
    }

    // The user object will be attached to the request
    return { id: payload.sub, email: payload.email };
  }
}
