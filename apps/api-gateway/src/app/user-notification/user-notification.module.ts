import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { UserNotificationController } from './user-notification.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'LOGGER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const certsPath = join(process.cwd(), 'certs');
          const certPath = join(
            certsPath,
            'api-gateway/api-gateway-cert.pem'
          );
          const keyPath = join(certsPath, 'api-gateway/api-gateway-key.pem');
          const caPath = join(certsPath, 'ca/ca-cert.pem');

          const useTls =
            existsSync(certPath) &&
            existsSync(keyPath) &&
            existsSync(caPath);

          const tcpOptions: {
            host: string;
            port: number;
            tlsOptions?: {
              key: Buffer;
              cert: Buffer;
              ca: Buffer;
              rejectUnauthorized: boolean;
            };
          } = {
            host:
              configService.get<string>('LOGGER_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('LOGGER_SERVICE_TCP_PORT') || '6011',
              10
            ),
          };

          if (useTls) {
            tcpOptions.tlsOptions = {
              key: readFileSync(keyPath),
              cert: readFileSync(certPath),
              ca: readFileSync(caPath),
              rejectUnauthorized: true,
            };
          }

          return {
            transport: Transport.TCP,
            options: tcpOptions,
          };
        },
      },
    ]),
  ],
  controllers: [UserNotificationController],
})
export class UserNotificationModule {}
