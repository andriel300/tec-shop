import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChattingService } from './chatting.service';
import { ChattingController } from './chatting.controller';
import { ChatMessageConsumer } from './chat-message.consumer';
import { ChatGateway } from './chat.gateway';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SellerClientModule } from '../clients/seller-client.module';
import { UserClientModule } from '../clients/user-client.module';
import { WsJwtModule } from '@tec-shop/ws-auth';

@Module({
  imports: [
    ConfigModule,
    WsJwtModule.register(),
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
