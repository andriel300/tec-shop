import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoggerController } from './logger.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'LOGGER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const certsPath = join(process.cwd(), 'certs');
          let tlsOptions: { key: Buffer; cert: Buffer; ca: Buffer; rejectUnauthorized: boolean };
          try {
            tlsOptions = {
              key: readFileSync(join(certsPath, 'api-gateway/api-gateway-key.pem')),
              cert: readFileSync(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
              ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
              rejectUnauthorized: true,
            };
          } catch (error) {
            throw new Error(
              `[mTLS] Failed to load API Gateway certificates for LOGGER_SERVICE: ${error instanceof Error ? error.message : String(error)}. Run ./generate-certs.sh --all`,
            );
          }
          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('LOGGER_SERVICE_HOST') || 'localhost',
              port: parseInt(configService.get<string>('LOGGER_SERVICE_TCP_PORT') || '6011', 10),
              tlsOptions,
            },
          };
        },
      },
    ]),
  ],
  controllers: [LoggerController],
})
export class LoggerGrafanaModule {}
