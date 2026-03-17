import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/**
 * Drop-in replacement for the duplicated JwtModule.registerAsync block
 * that every WebSocket service module used to declare inline.
 *
 * Usage:
 *   imports: [WsJwtModule.register()]
 *
 * JwtService will be available for injection in the host module's providers.
 */
@Module({})
export class WsJwtModule {
  static register(): DynamicModule {
    return {
      module: WsJwtModule,
      imports: [
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const secret = configService.get<string>('JWT_SECRET');
            if (!secret || secret.length < 32) {
              throw new Error(
                'JWT_SECRET must be configured and at least 32 characters'
              );
            }
            return { secret, signOptions: { expiresIn: '24h' } };
          },
        }),
      ],
      exports: [JwtModule],
    };
  }
}
