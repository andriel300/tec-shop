import { Module, Injectable, Inject, Logger } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';

interface SellerProfile {
  id: string;
  authId: string;
  name: string;
  avatar?: string;
  shop?: {
    id: string;
    name: string;
    logo?: string;
  };
}

/**
 * Seller Service Client
 * Provides mTLS-secured communication with seller-service
 */
@Injectable()
export class SellerServiceClient {
  private readonly logger = new Logger(SellerServiceClient.name);

  constructor(
    @Inject('SELLER_SERVICE') private readonly client: ClientProxy
  ) {}

  /**
   * Verify that a seller exists by their ID
   * @param sellerId - The seller ID to verify
   * @returns Promise<boolean> - true if seller exists, false otherwise
   */
  async verifySellerExists(sellerId: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.client.send<SellerProfile | null>('get-seller-profile', sellerId)
      );
      return result !== null;
    } catch (error) {
      this.logger.error(`Error verifying seller ${sellerId}:`, error);
      return false;
    }
  }

  /**
   * Get seller profile by ID
   * @param sellerId - The seller ID
   * @returns Promise<SellerProfile | null> - Seller profile or null
   */
  async getSellerProfile(sellerId: string): Promise<SellerProfile | null> {
    try {
      return await firstValueFrom(
        this.client.send<SellerProfile | null>('get-seller-profile', sellerId)
      );
    } catch (error) {
      this.logger.error(`Error getting seller profile ${sellerId}:`, error);
      return null;
    }
  }

  /**
   * Get seller info for chat display (name, avatar)
   * @param sellerId - The seller ID
   * @returns Promise with seller display info
   */
  async getSellerChatInfo(
    sellerId: string
  ): Promise<{ name: string; avatar?: string } | null> {
    try {
      const seller = await this.getSellerProfile(sellerId);
      if (!seller) return null;

      return {
        name: seller.shop?.name || seller.name || 'Seller',
        avatar: seller.shop?.logo || seller.avatar,
      };
    } catch (error) {
      this.logger.error(`Error getting seller chat info ${sellerId}:`, error);
      return null;
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
        const chattingCertPath = join(
          certsPath,
          'chatting-service/chatting-service-cert.pem'
        );
        const chattingKeyPath = join(
          certsPath,
          'chatting-service/chatting-service-key.pem'
        );
        const caPath = join(certsPath, 'ca/ca-cert.pem');

        // Check if certificates exist - mTLS is optional
        const useTls =
          existsSync(chattingCertPath) &&
          existsSync(chattingKeyPath) &&
          existsSync(caPath);

        const options: {
          host: string;
          port: number;
          tlsOptions?: {
            key: Buffer;
            cert: Buffer;
            ca: Buffer;
            rejectUnauthorized: boolean;
          };
        } = {
          host: process.env['SELLER_SERVICE_HOST'] || 'localhost',
          port: parseInt(process.env['SELLER_SERVICE_PORT'] || '6003', 10),
        };

        if (useTls) {
          options.tlsOptions = {
            key: readFileSync(chattingKeyPath),
            cert: readFileSync(chattingCertPath),
            ca: readFileSync(caPath),
            rejectUnauthorized: true,
          };
        }

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options,
        });
      },
    },
    SellerServiceClient,
  ],
  exports: [SellerServiceClient],
})
export class SellerClientModule {}
