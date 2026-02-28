import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  // @ts-expect-error: configService is used in constructor call
  constructor(private readonly configService: ConfigService) {
    const googleClientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const googleClientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const googleCallbackUrl = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!googleClientId || !googleClientSecret) {
      throw new Error(
        'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables must be configured for Google OAuth.'
      );
    }

    super({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl || 'http://localhost:8080/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): void {
    const { id, emails, displayName, photos } = profile;

    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('No email found in Google profile'), undefined);
    }

    const user = {
      googleId: id,
      email,
      name: displayName,
      picture: photos?.[0]?.value,
    };

    done(null, user);
  }
}
