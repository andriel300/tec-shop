import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@tec-shop/redis-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CategoryController } from './category.controller';

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
    RedisModule.forRoot(),
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
    ]),
  ],
  controllers: [CategoryController],
})
export class CategoryModule {}
