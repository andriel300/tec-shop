import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderController } from './order.controller';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadGatewayCerts(): { key: Buffer; cert: Buffer; ca: Buffer; rejectUnauthorized: boolean } {
  try {
    const certsPath = join(process.cwd(), 'certs');
    return {
      key: readFileSync(join(certsPath, 'api-gateway/api-gateway-key.pem')),
      cert: readFileSync(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
      ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
      rejectUnauthorized: true,
    };
  } catch (error) {
    throw new Error(
      `[mTLS] Failed to load API Gateway certificates: ${error instanceof Error ? error.message : String(error)}. Run ./generate-certs.sh --all`,
    );
  }
}

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('ORDER_SERVICE_HOST', 'localhost'),
            port: parseInt(config.get('ORDER_SERVICE_PORT', '6005'), 10),
            tlsOptions: loadGatewayCerts(),
          },
        }),
      },
      {
        name: 'SELLER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('SELLER_SERVICE_HOST', 'localhost'),
            port: parseInt(config.get('SELLER_SERVICE_PORT', '6003'), 10),
            tlsOptions: loadGatewayCerts(),
          },
        }),
      },
    ]),
  ],
  controllers: [OrderController],
})
export class OrderModule {}
