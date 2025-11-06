import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { GoogleStrategy } from '../../strategies/google.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Load mTLS certificates for client authentication
          const certsPath = join(process.cwd(), 'certs');
          const tlsOptions = {
            key: readFileSync(join(certsPath, 'api-gateway/api-gateway-key.pem')),
            cert: readFileSync(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
            ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
            checkServerIdentity: () => undefined, // Allow self-signed certificates
          };

          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('AUTH_SERVICE_HOST') || 'localhost',
              port: parseInt(
                configService.get<string>('AUTH_SERVICE_PORT') || '6001',
                10
              ),
              tlsOptions,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, GoogleStrategy],
  exports: [ClientsModule, PassportModule, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
