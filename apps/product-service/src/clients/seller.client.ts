import { Module, Injectable, Inject } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { readFileSync } from 'fs';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';

/**
 * Seller Service Client
 * Provides mTLS-secured communication with seller-service
 */
@Injectable()
export class SellerServiceClient {
  constructor(@Inject('SELLER_SERVICE') private readonly client: ClientProxy) {}

  /**
   * Verify that a shop exists by its ID
   * @param shopId - The shop ID to verify
   * @returns Promise<boolean> - true if shop exists, false otherwise
   */
  async verifyShopExists(shopId: string): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.client.send<boolean>('seller-verify-shop', { shopId })
      );
    } catch (error) {
      console.error('Error verifying shop:', error);
      return false;
    }
  }

  /**
   * Get shop details by ID
   * @param shopId - The shop ID
   * @returns Promise<Shop | null> - Shop details or null
   */
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

  /**
   * Verify that a seller owns a specific shop
   * @param sellerId - The seller ID
   * @param shopId - The shop ID
   * @returns Promise<boolean> - true if seller owns shop
   */
  async verifyShopOwnership(
    sellerId: string,
    shopId: string
  ): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.client.send<boolean>('seller-verify-shop-ownership', {
          sellerId,
          shopId,
        })
      );
    } catch (error) {
      console.error('Error verifying shop ownership:', error);
      return false;
    }
  }
}

/**
 * Seller Service Client Module
 * Configures mTLS connection to seller-service
 */
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
                join(certsPath, 'product-service/product-service-key.pem')
              ),
              cert: readFileSync(
                join(certsPath, 'product-service/product-service-cert.pem')
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
