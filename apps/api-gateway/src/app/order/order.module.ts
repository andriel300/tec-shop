import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderController } from './order.controller';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ORDER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ORDER_SERVICE_PORT || '6005', 10),
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
  controllers: [OrderController],
})
export class OrderModule {}
