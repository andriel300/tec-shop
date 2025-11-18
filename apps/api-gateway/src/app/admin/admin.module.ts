import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdminController } from './admin.controller';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'ADMIN_SERVICE',
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
              host: configService.get<string>('ADMIN_SERVICE_HOST') || 'localhost',
              port: configService.get<number>('ADMIN_SERVICE_PORT') || 6006,
              tlsOptions,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
