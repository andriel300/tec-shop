import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
// Rate limiting moved to API Gateway level for proper microservices architecture
import { AuthController } from './auth.controller';
import { AuthCoreService } from './auth-core.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthTotpService } from './auth-totp.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '@tec-shop/redis-client';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    RedisModule.forRoot(),
    // ThrottlerModule removed - rate limiting handled at API Gateway
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Load mTLS certificates for client authentication
          const certsPath = join(process.cwd(), 'certs');
          const tlsOptions = {
            key: readFileSync(join(certsPath, 'auth-service/auth-service-key.pem')),
            cert: readFileSync(join(certsPath, 'auth-service/auth-service-cert.pem')),
            ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
            rejectUnauthorized: true,
          };

          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('USER_SERVICE_HOST') || 'localhost',
              port: configService.get<number>('USER_SERVICE_PORT') || 6002,
              tlsOptions,
            },
          };
        },
        inject: [ConfigService],
      },
      {
        name: 'SELLER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Load mTLS certificates for client authentication
          const certsPath = join(process.cwd(), 'certs');
          const tlsOptions = {
            key: readFileSync(join(certsPath, 'auth-service/auth-service-key.pem')),
            cert: readFileSync(join(certsPath, 'auth-service/auth-service-cert.pem')),
            ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
            rejectUnauthorized: true,
          };

          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('SELLER_SERVICE_HOST') || 'localhost',
              port: configService.get<number>('SELLER_SERVICE_PORT') || 6003,
              tlsOptions,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthCoreService,
    AuthRegistrationService,
    AuthTotpService,
    // ThrottlerGuard removed - rate limiting handled at API Gateway
  ],
})
export class AuthModule {}
