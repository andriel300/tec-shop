import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { EmailModule } from '../email/email.module';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    RedisModule,
    EmailModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute for general auth operations
      },
      {
        name: 'medium',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 attempts per 15 minutes for sensitive operations
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
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
            checkServerIdentity: () => undefined, // Allow self-signed certificates
          };

          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('USER_SERVICE_HOST'),
              port: configService.get<number>('USER_SERVICE_PORT'),
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
    AuthService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AuthModule {}
