import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
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
              host: configService.get<string>('USER_SERVICE_HOST') || 'localhost',
              port: parseInt(
                configService.get<string>('USER_SERVICE_PORT') || '6002',
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
  controllers: [UserController],
  providers: [JwtAuthGuard],
})
export class UserModule {}
