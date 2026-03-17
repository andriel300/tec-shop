import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import {
  Injectable,
  Logger,
  UsePipes,
  UseFilters,
  ValidationPipe,
  Inject,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { KafkaService } from '../kafka/kafka.service';
import { ParticipantType, SenderType } from '@tec-shop/dto';
import type { ChatMessageEventDto, MarkAsSeenDto } from '@tec-shop/dto';
import { MessageRedisService } from '../redis/message.redis.service';
import { OnlineRedisService } from '../redis/online.redis.service';
import { WsJwtPayload, extractWsToken, WsExceptionFilter } from '@tec-shop/ws-auth';

interface SocketUserInfo {
  userId: string;
  userType: ParticipantType;
}

interface SendMessagePayload {
  conversationId: string;
  content: string;
  attachments?: { url: string; type?: string }[];
}

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

@Injectable()
@WebSocketGateway()
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe())
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly socketToUser = new Map<string, SocketUserInfo>();

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly messageRedisService: MessageRedisService,
    private readonly onlineRedisService: OnlineRedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis
  ) {}

  afterInit(server: Server): void {
    const pubClient = this.redisClient.duplicate();
    const subClient = this.redisClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    this.logger.log('Socket.IO Redis adapter initialized');
  }

  onApplicationShutdown(): void {
    this.server.disconnectSockets();
    this.logger.log('WebSocket server disconnected all clients');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      const token = extractWsToken(client, isProduction);

      if (!token) {
        this.logger.warn(`Connection rejected: No token (${client.id})`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token (${client.id})`);
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      const userType: ParticipantType =
        payload.userType === 'SELLER' ? ParticipantType.SELLER : ParticipantType.USER;

      // payload.sub is the canonical user ID — matches JwtStrategy (sub → userId)
      this.socketToUser.set(client.id, { userId: payload.sub, userType });

      await this.onlineRedisService.setUserOnline(payload.sub, client.id);

      this.logger.log(`Client connected: ${payload.sub} (${userType}) - Socket: ${client.id}`);

      client.emit('connected', {
        message: 'WebSocket connected successfully',
        userId: payload.sub,
        userType,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userInfo = this.socketToUser.get(client.id);
    if (userInfo) {
      this.socketToUser.delete(client.id);
      await this.onlineRedisService.setUserOffline(userInfo.userId);
      this.logger.log(`Client disconnected: ${userInfo.userId} (${userInfo.userType})`);
    }
  }

  emitMessage(message: ChatMessageEventDto): void {
    this.server.to(message.conversationId).emit('chat_message', message);
  }

  emitBroadcast(message: {
    id: string;
    conversationId: string;
    senderId: string;
    senderType: string;
    content: string;
    attachments: { url: string; type?: string }[];
    createdAt: string;
  }): void {
    this.server.to(message.conversationId).emit('chat_message', message);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket
  ): void {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    client.join(conversationId);
    this.logger.log(`User ${userInfo.userId} joined conversation: ${conversationId}`);
    client.emit('joined_conversation', { conversationId });
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket
  ): void {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    client.leave(conversationId);
    this.logger.log(`User ${userInfo.userId} left conversation: ${conversationId}`);
    client.emit('left_conversation', { conversationId });
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket): Promise<void> {
    const userInfo = this.socketToUser.get(client.id);
    if (userInfo) {
      await this.onlineRedisService.refreshUserOnline(userInfo.userId);
    }
  }

  @SubscribeMessage('send_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessagePayload
  ): Promise<void> {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    const { conversationId, content, attachments } = data;
    const hasContent = content && content.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if (!conversationId || (!hasContent && !hasAttachments)) {
      throw new WsException('conversationId and content or attachments are required');
    }

    try {
      const now = new Date().toISOString();
      const payload: ChatMessageEventDto = {
        conversationId,
        senderId: userInfo.userId,
        senderType: userInfo.userType as unknown as SenderType,
        content: content || '',
        createdAt: now,
        attachments: attachments?.map((a) => ({ url: a.url, type: a.type })),
      };

      await this.kafkaService.sendMessage('chat.new_message', conversationId, payload);

      this.logger.log(`Message queued: ${userInfo.userId} -> ${conversationId}`);

      client.emit('message_sent', {
        conversationId,
        tempId: data,
        status: 'queued',
        createdAt: now,
      });
    } catch (error) {
      this.logger.error('Error handling message:', error);
      throw new WsException('Failed to send message');
    }
  }

  @SubscribeMessage('mark_as_seen')
  async markAsSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkAsSeenDto
  ): Promise<{ status: string }> {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    await this.messageRedisService.clearUnseenCount(userInfo.userId, data.conversationId);

    this.logger.log(`Cleared unseen count for ${userInfo.userId} in ${data.conversationId}`);

    this.server.to(data.conversationId).emit('messages_seen', {
      conversationId: data.conversationId,
      userId: userInfo.userId,
      userType: userInfo.userType,
      seenAt: new Date().toISOString(),
    });

    return { status: 'seen' };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload
  ): void {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    client.to(data.conversationId).emit('user_typing', {
      conversationId: data.conversationId,
      userId: userInfo.userId,
      userType: userInfo.userType,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('check_online')
  async handleCheckOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string
  ): Promise<{ userId: string; isOnline: boolean }> {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    const isOnline = await this.onlineRedisService.isUserOnline(userId);
    return { userId, isOnline };
  }

  private verifyToken(token: string): WsJwtPayload | null {
    try {
      return this.jwtService.verify<WsJwtPayload>(token);
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error}`);
      return null;
    }
  }
}
