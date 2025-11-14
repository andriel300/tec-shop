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
export class UserServiceClient {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  async getShippingAddress(
    userId: string,
    addressId: string
  ): Promise<Record<string, unknown> | null> {
    try {
      return await firstValueFrom(
        this.client.send<Record<string, unknown>>('get-shipping-address', {
          userId,
          addressId,
        })
      );
    } catch (error) {
      console.error('Error getting shipping address:', error);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<Record<string, unknown> | null> {
    try {
      return await firstValueFrom(
        this.client.send<Record<string, unknown>>('get-user-profile', userId)
      );
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}

@Module({
  providers: [
    {
      provide: 'USER_SERVICE',
      useFactory: () => {
        const certsPath = join(process.cwd(), 'certs');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: process.env.USER_SERVICE_HOST || 'localhost',
            port: parseInt(process.env.USER_SERVICE_PORT || '6002', 10),
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
    UserServiceClient,
  ],
  exports: [UserServiceClient],
})
export class UserClientModule {}
