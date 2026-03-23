import { Module, Injectable, Inject, Logger } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { readFileSync } from 'fs';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthServiceClient {
  private readonly logger = new Logger(AuthServiceClient.name);

  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientProxy) {}

  async getUserEmail(userId: string): Promise<{ email: string } | null> {
    try {
      return await firstValueFrom(
        this.client.send<{ email: string }>('get-user-email', userId)
      );
    } catch (error) {
      this.logger.error('Error getting user email', error);
      return null;
    }
  }
}

@Module({
  providers: [
    {
      provide: 'AUTH_SERVICE',
      useFactory: () => {
        const certsPath = join(process.cwd(), 'certs');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: process.env.AUTH_SERVICE_HOST || 'localhost',
            port: parseInt(process.env.AUTH_SERVICE_PORT || '6001', 10),
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
    AuthServiceClient,
  ],
  exports: [AuthServiceClient],
})
export class AuthClientModule {}
