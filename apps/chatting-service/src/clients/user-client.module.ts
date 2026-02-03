import { Module, Injectable, Inject, Logger } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';

interface UserProfile {
  id: string;
  authId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  email?: string;
}

/**
 * User Service Client
 * Provides mTLS-secured communication with user-service
 */
@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);

  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  /**
   * Verify that a user exists by their ID
   * @param userId - The user ID to verify
   * @returns Promise<boolean> - true if user exists, false otherwise
   */
  async verifyUserExists(userId: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.client.send<UserProfile | null>('get-user-profile', userId)
      );
      return result !== null;
    } catch (error) {
      this.logger.error(`Error verifying user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get user profile by ID
   * @param userId - The user ID
   * @returns Promise<UserProfile | null> - User profile or null
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      return await firstValueFrom(
        this.client.send<UserProfile | null>('get-user-profile', userId)
      );
    } catch (error) {
      this.logger.error(`Error getting user profile ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user info for chat display (name, avatar)
   * @param userId - The user ID
   * @returns Promise with user display info
   */
  async getUserChatInfo(
    userId: string
  ): Promise<{ name: string; avatar?: string } | null> {
    try {
      const user = await this.getUserProfile(userId);
      if (!user) return null;

      const name =
        user.displayName ||
        (user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || 'User');

      return {
        name,
        avatar: user.avatar,
      };
    } catch (error) {
      this.logger.error(`Error getting user chat info ${userId}:`, error);
      return null;
    }
  }
}

/**
 * User Service Client Module
 * Configures mTLS connection to user-service
 */
@Module({
  providers: [
    {
      provide: 'USER_SERVICE',
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
          host: process.env['USER_SERVICE_HOST'] || 'localhost',
          port: parseInt(process.env['USER_SERVICE_PORT'] || '6002', 10),
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
    UserServiceClient,
  ],
  exports: [UserServiceClient],
})
export class UserClientModule {}
