import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
// Rate limiting moved to API Gateway level for proper microservices architecture
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
    // ThrottlerModule removed - rate limiting handled at API Gateway
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
            checkServerIdentity: () => undefined, // Allow self-signed certificates
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
    AuthService,
    // ThrottlerGuard removed - rate limiting handled at API Gateway
  ],
})
export class AuthModule {}
