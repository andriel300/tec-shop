import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthCoreService } from './auth-core.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthTotpService } from './auth-totp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { SellerModule } from '../seller/seller.module';
import { RedisModule } from '@tec-shop/redis-client';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { GoogleStrategy } from '../common/strategies/google.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    ConfigModule,
    RedisModule.forRoot(),
    UserModule,
    SellerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthCoreService,
    AuthRegistrationService,
    AuthTotpService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [AuthModule],
})
export class AuthModule {}
