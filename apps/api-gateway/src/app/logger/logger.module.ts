import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoggerController } from './logger.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LOGGER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.LOGGER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.LOGGER_SERVICE_PORT || '6008', 10),
          tlsOptions: {
            key: readFileSync(
              join(process.cwd(), 'certs/api-gateway/api-gateway-key.pem')
            ),
            cert: readFileSync(
              join(process.cwd(), 'certs/api-gateway/api-gateway-cert.pem')
            ),
            ca: readFileSync(join(process.cwd(), 'certs/ca/ca-cert.pem')),
            rejectUnauthorized: true,
          },
        },
      },
    ]),
  ],
  controllers: [LoggerController],
})
export class LoggerGrafanaModule {}
