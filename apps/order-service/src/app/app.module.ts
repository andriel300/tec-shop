import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { OrderService } from './order.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { UserClientModule } from '../clients/user.client';
import { SellerClientModule } from '../clients/seller.client';
import { PaymentService } from '../services/payment.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { WebhookService } from '../services/webhook.service';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    EmailModule,
    UserClientModule,
    SellerClientModule,
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        pinoHttp: {
          level:
            config.get<string>('NODE_ENV') !== 'production' ? 'debug' : 'info',
          transport:
            config.get<string>('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    OrderService,
    PaymentService,
    KafkaProducerService,
    WebhookService,
  ],
})
export class AppModule {}
