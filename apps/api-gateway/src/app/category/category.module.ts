import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RedisModule } from '@tec-shop/redis-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CategoryController } from './category.controller';

@Module({
  imports: [
    RedisModule.forRoot(),
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
    ]),
  ],
  controllers: [CategoryController],
})
export class CategoryModule {}
