import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChatMessageEventDto } from '@tec-shop/dto';
import type { NotificationEventDto, NotificationTargetType } from '@tec-shop/dto';
import { KafkaService } from '../kafka/kafka.service';
import { Consumer } from 'kafkajs';
import { ChatGateway } from './chat.gateway';
import { ChattingPrismaService } from '../prisma/prisma.service';
import { MessageRedisService } from '../redis/message.redis.service';
import { RedisService } from '../redis/redis.service';

const TOPIC = 'chat.new_message';
const GROUP_ID = 'chat-message-db-writter';

@Injectable()
export class ChatMessageConsumer implements OnModuleInit {
  private readonly logger = new Logger(ChatMessageConsumer.name);
  private kafkaConsumer: Consumer;

  constructor(
    private readonly kafka: KafkaService,
    private readonly prisma: ChattingPrismaService,
    private readonly redis: RedisService,
    private readonly messageRedisService: MessageRedisService,
    private readonly chatGateway: ChatGateway,
  ) {
    this.kafkaConsumer = this.kafka.createConsumer(GROUP_ID);
  }

  async onModuleInit() {
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe({ topic: TOPIC, fromBeginning: false });
    this.logger.log('ChatMessageConsumer is running...');

    await this.kafkaConsumer.run({
      eachMessage: async ({ topic: _topic, partition: _partition, message }) => {
        try {
          const raw = message.value?.toString();
          if (!raw) return;

          const data: ChatMessageEventDto = JSON.parse(raw);
          this.logger.verbose(
            `Received message from Kafka: in conversation ${data.conversationId}`,
          );

          await this.handleMessage(data);
        } catch (error) {
          this.logger.error('Error processing chat message', error);
        }
      },
    });
  }

  private async handleMessage(dto: ChatMessageEventDto) {
    const { conversationId, senderId, content, senderType, createdAt, attachments } = dto;

    // 1. Save message in DB
    const saved = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        senderType,
        content,
        createdAt: new Date(createdAt),
        attachments: (attachments ?? []) as unknown[],
      },
    });

    // 2. Cache last message in Redis
    await this.redis.setJson(`chat:room:${conversationId}:last`, saved);
    await this.redis.lpush(
      `chat:room:${conversationId}:history`,
      JSON.stringify(saved),
    );
    await this.redis.ltrim(
      `chat:room:${conversationId}:history`,
      0,
      50,
    );

    // 3. Emit saved message (with DB id) to WebSocket clients
    const broadcastPayload = {
      id: saved.id,
      conversationId: saved.conversationId,
      senderId: saved.senderId,
      senderType: saved.senderType,
      content: saved.content ?? '',
      attachments: (saved.attachments ?? []) as { url: string; type?: string }[],
      createdAt: saved.createdAt.toISOString(),
    };
    this.chatGateway.emitBroadcast(broadcastPayload);
    this.logger.log(
      `Processed & broadcasted message in conversation ${conversationId}`,
    );

    // 4. Handle unseen count
    const participants = await this.prisma.participant.findMany({
      where: { conversationId },
    });

    for (const participant of participants) {
      const participantId = participant.userId || participant.sellerId;
      if (participantId && participantId !== senderId) {
        await this.messageRedisService.incrementUnseenCount(
          participantId,
          conversationId,
        );
        this.logger.log(
          `Incremented unseen count for ${participantId} in ${conversationId}`,
        );

        // Publish notification event for the receiver
        const targetType: NotificationTargetType = participant.userId
          ? 'customer'
          : 'seller';
        const preview =
          content && content.trim().length > 0
            ? content.slice(0, 80)
            : 'Sent you an image';
        const senderLabel = senderType === 'seller' ? 'A seller' : 'A customer';
        const notification: NotificationEventDto = {
          targetType,
          targetId: participantId,
          templateId: 'chat.new_message',
          title: 'New Message',
          message: `${senderLabel}: ${preview}`,
          type: 'INFO',
          metadata: { conversationId, senderId, senderType },
          timestamp: new Date().toISOString(),
        };
        await this.kafka.sendMessage(
          'notification-events',
          participantId,
          notification,
        );
      }
    }
  }
}
