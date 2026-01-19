import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import {
  ChatMessageEventDto,
  CreateChatMessageDto,
  MarkAsSeenDto,
} from '@tec-shop/dto';
import { MessageRedisService } from '../redis/message.redis.service';
import { OnlineRedisService } from '../redis/online.redis.service';

const socketToUser = new Map<string, string>();

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
})
@UsePipes(new ValidationPipe())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly messageRedisService: MessageRedisService,
    private readonly onlineRedisService: OnlineRedisService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', {
      message: 'WebSocket connected successfully',
    });
  }

  async handleDisconnect(client: Socket) {
    const userId = socketToUser.get(client.id);
    if (userId) {
      socketToUser.delete(client.id);
      await this.onlineRedisService.setUserOffline(userId);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  emitMessage(message: ChatMessageEventDto) {
    this.server.to(message.conversationId).emit('chat_message', message);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
    client.emit('joined_conversation', { conversationId });
  }

  @SubscribeMessage('register')
  async registerUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    socketToUser.set(client.id, userId);
    await this.onlineRedisService.setUserOnline(userId, client.id);
    this.logger.log(`Registered websocket for user: ${userId}`);
    return { status: 'ok' };
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = socketToUser.get(client.id);
    if (userId) {
      await this.onlineRedisService.refreshUserOnline(userId);
    }
  }

  @SubscribeMessage('send_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateChatMessageDto,
  ) {
    try {
      const now = new Date().toISOString();
      const payload: ChatMessageEventDto = { ...data, createdAt: now };

      await this.kafkaService.sendMessage(
        'chat.new_message',
        data.conversationId,
        payload,
      );

      this.logger.log(`Message queued to Kafka: ${data.conversationId}`);
    } catch (error) {
      this.logger.error('Error handling message:', error);
    }
  }

  @SubscribeMessage('mark_as_seen')
  async markAsSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkAsSeenDto,
  ) {
    const { conversationId, userId } = data;
    await this.messageRedisService.clearUnseenCount(userId, conversationId);
    this.logger.log(`Cleared unseen count for ${userId} in ${conversationId}`);
    return { status: 'seen' };
  }
}
