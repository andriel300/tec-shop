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
export class ProductServiceClient {
  private readonly logger = new Logger(ProductServiceClient.name);

  constructor(@Inject('PRODUCT_SERVICE') private readonly client: ClientProxy) {}

  async getProductsByIds(ids: string[]): Promise<Record<string, unknown>[]> {
    try {
      return await firstValueFrom(
        this.client.send<Record<string, unknown>[]>('product-get-by-ids', { ids })
      );
    } catch (error) {
      this.logger.error('Error fetching products by IDs', error);
      return [];
    }
  }
}

@Module({
  providers: [
    {
      provide: 'PRODUCT_SERVICE',
      useFactory: () => {
        const certsPath = join(process.cwd(), 'certs');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: process.env.PRODUCT_SERVICE_HOST || 'localhost',
            port: parseInt(process.env.PRODUCT_SERVICE_PORT || '6004', 10),
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
    ProductServiceClient,
  ],
  exports: [ProductServiceClient],
})
export class ProductClientModule {}
