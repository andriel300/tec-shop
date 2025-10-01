import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SellerController } from './seller.controller';
import { StripeController } from '../stripe/stripe.controller';
import { StripeWebhookController } from '../webhooks/stripe-webhook.controller';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
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
    ]),
  ],
  controllers: [SellerController, StripeController, StripeWebhookController],
})
export class SellerModule {}