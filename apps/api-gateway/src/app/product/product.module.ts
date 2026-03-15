import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProductController } from './product.controller';
import { ImageKitModule } from '@tec-shop/shared/imagekit';

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
    ImageKitModule.forRoot(),
    ClientsModule.registerAsync([
      {
        name: 'PRODUCT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('PRODUCT_SERVICE_HOST', 'localhost'),
            port: parseInt(config.get('PRODUCT_SERVICE_PORT', '6004'), 10),
            tlsOptions: loadGatewayCerts(),
          },
        }),
      },
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
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('USER_SERVICE_HOST', 'localhost'),
            port: parseInt(config.get('USER_SERVICE_PORT', '6002'), 10),
            tlsOptions: loadGatewayCerts(),
          },
        }),
      },
    ]),
  ],
  controllers: [ProductController],
})
export class ProductModule {}
