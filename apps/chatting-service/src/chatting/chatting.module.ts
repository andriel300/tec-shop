import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChattingService } from './chatting.service';
import { ChattingController } from './chatting.controller';
import { ChatMessageConsumer } from './chat-message.consumer';
import { ChatGateway } from './chat.gateway';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SellerClientModule } from '../clients/seller-client.module';
import { UserClientModule } from '../clients/user-client.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error(
            'JWT_SECRET must be configured and at least 32 characters'
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
    KafkaModule,
    RedisModule,
    PrismaModule,
    SellerClientModule,
    UserClientModule,
  ],
  controllers: [ChattingController],
  providers: [ChattingService, ChatMessageConsumer, ChatGateway],
  exports: [ChattingService],
})
export class ChattingModule {}
