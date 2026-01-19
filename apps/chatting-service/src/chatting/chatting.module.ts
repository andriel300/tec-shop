import { Module } from '@nestjs/common';
import { ChattingService } from './chatting.service';
import { ChattingController } from './chatting.controller';
import { ChatMessageConsumer } from './chat-message.consumer';
import { ChatGateway } from './chat.gateway';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [KafkaModule, RedisModule],
  controllers: [ChattingController],
  providers: [ChattingService, ChatMessageConsumer, ChatGateway],
})
export class ChattingModule {}
