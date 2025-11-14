import { Module, Injectable, Inject } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { readFileSync } from 'fs';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SellerServiceClient {
  constructor(@Inject('SELLER_SERVICE') private readonly client: ClientProxy) {}

  async getSellerByAuthId(authId: string): Promise<Record<string, unknown> | null> {
    try {
      return await firstValueFrom(
        this.client.send<Record<string, unknown>>('get-seller-by-auth-id', authId)
      );
    } catch (error) {
      console.error('Error getting seller by auth ID:', error);
      return null;
    }
  }

  async getShop(shopId: string): Promise<Record<string, unknown> | null> {
    try {
      return await firstValueFrom(
        this.client.send<Record<string, unknown>>('seller-get-shop-by-id', {
          shopId,
        })
      );
    } catch (error) {
      console.error('Error getting shop:', error);
      return null;
    }
  }

  async verifyCouponCode(
    couponCode: string,
    sellerId: string
  ): Promise<Record<string, unknown> | null> {
    try {
      return await firstValueFrom(
        this.client.send<Record<string, unknown>>('verify-coupon-code', {
          couponCode,
          sellerId,
        })
      );
    } catch (error) {
      console.error('Error verifying coupon:', error);
      return null;
    }
  }
}

@Module({
  providers: [
    {
      provide: 'SELLER_SERVICE',
      useFactory: () => {
        const certsPath = join(process.cwd(), 'certs');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: process.env.SELLER_SERVICE_HOST || 'localhost',
            port: parseInt(process.env.SELLER_SERVICE_PORT || '6003', 10),
            tlsOptions: {
              key: readFileSync(
                join(certsPath, 'order-service/order-service-key.pem')
              ),
              cert: readFileSync(
                join(certsPath, 'order-service/order-service-cert.pem')
              ),
              ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
              rejectUnauthorized: true,
            },
          },
        });
      },
    },
    SellerServiceClient,
  ],
  exports: [SellerServiceClient],
})
export class SellerClientModule {}
