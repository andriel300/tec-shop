import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdminController } from './admin.controller';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'ADMIN_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          // Load mTLS certificates for client authentication
          const certsPath = join(process.cwd(), 'certs');
          const [key, cert, ca] = await Promise.all([
            readFile(join(certsPath, 'api-gateway/api-gateway-key.pem')),
            readFile(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
            readFile(join(certsPath, 'ca/ca-cert.pem')),
          ]);
          const tlsOptions = {
            key,
            cert,
            ca,
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
