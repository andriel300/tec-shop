import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PublicProductsController } from './public-products.controller';
import { PublicShopsController } from './public-shops.controller';
import { PublicCategoriesController } from './public-categories.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PRODUCT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.PRODUCT_SERVICE_PORT || '6004', 10),
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
      {
        name: 'SELLER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.SELLER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.SELLER_SERVICE_PORT || '6003', 10),
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
  controllers: [
    PublicProductsController,
    PublicShopsController,
    PublicCategoriesController,
  ],
})
export class PublicModule {}
