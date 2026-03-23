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
export class ChatServiceClient {
  private readonly logger = new Logger(ChatServiceClient.name);

  constructor(@Inject('CHAT_SERVICE') private readonly client: ClientProxy) {}

  async sendThankYouMessage(
    sellerId: string,
    customerId: string,
    orderNumber: string,
    productNames: string
  ): Promise<void> {
    try {
      const message = `Thank you for your order #${orderNumber}! 🎉 We're preparing your ${productNames} for shipping and will keep you updated. Feel free to reach out if you have any questions!`;

      await firstValueFrom(
        this.client.send('chatting.createConversation', {
          initiatorId: sellerId,
          initiatorType: 'seller',
          targetId: customerId,
          targetType: 'user',
          initialMessage: message,
        })
      );
    } catch (error) {
      this.logger.warn(`Failed to send thank-you chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

@Module({
  providers: [
    {
      provide: 'CHAT_SERVICE',
      useFactory: () => {
        const certsPath = join(process.cwd(), 'certs');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: process.env.CHATTING_SERVICE_HOST || 'localhost',
            port: parseInt(process.env.CHATTING_SERVICE_TCP_PORT || '6010', 10),
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
    ChatServiceClient,
  ],
  exports: [ChatServiceClient],
})
export class ChatClientModule {}
