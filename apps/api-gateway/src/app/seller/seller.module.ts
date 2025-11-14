import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SellerController, PublicShopsController } from './seller.controller';
import { StripeController } from '../stripe/stripe.controller';
import { StripeWebhookController } from '../webhooks/stripe-webhook.controller';
import { ImageKitModule } from '@tec-shop/shared/imagekit';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    ImageKitModule.forRoot(),
    ClientsModule.registerAsync([
      {
        name: 'SELLER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Load mTLS certificates for client authentication
          const certsPath = join(process.cwd(), 'certs');
          const tlsOptions = {
            key: readFileSync(join(certsPath, 'api-gateway/api-gateway-key.pem')),
            cert: readFileSync(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
            ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
            checkServerIdentity: () => undefined, // Allow self-signed certificates
          };

          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('SELLER_SERVICE_HOST') || 'localhost',
              port: configService.get<number>('SELLER_SERVICE_PORT') || 6003,
              tlsOptions,
            },
          };
        },
        inject: [ConfigService],
      },
      {
        name: 'PRODUCT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Load mTLS certificates for client authentication
          const certsPath = join(process.cwd(), 'certs');
          const tlsOptions = {
            key: readFileSync(join(certsPath, 'api-gateway/api-gateway-key.pem')),
            cert: readFileSync(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
            ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
            checkServerIdentity: () => undefined, // Allow self-signed certificates
          };

          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('PRODUCT_SERVICE_HOST') || 'localhost',
              port: configService.get<number>('PRODUCT_SERVICE_PORT') || 6004,
              tlsOptions,
            },
          };
        },
        inject: [ConfigService],
      },
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Load mTLS certificates for client authentication
          const certsPath = join(process.cwd(), 'certs');
          const tlsOptions = {
            key: readFileSync(join(certsPath, 'api-gateway/api-gateway-key.pem')),
            cert: readFileSync(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
            ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
            checkServerIdentity: () => undefined, // Allow self-signed certificates
          };

          return {
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('ORDER_SERVICE_HOST') || 'localhost',
              port: configService.get<number>('ORDER_SERVICE_PORT') || 6005,
              tlsOptions,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [SellerController, PublicShopsController, StripeController, StripeWebhookController],
})
export class SellerModule {}