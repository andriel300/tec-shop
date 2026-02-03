import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KafkaService } from '../kafka/kafka.service';
import type {
  ChatMessageEventDto,
  MarkAsSeenDto,
  ParticipantType,
} from '@tec-shop/dto';
import { MessageRedisService } from '../redis/message.redis.service';
import { OnlineRedisService } from '../redis/online.redis.service';

interface JwtPayload {
  userId: string;
  username: string;
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  role?: string;
  iat?: number;
  exp?: number;
}

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

// Map socket ID to user info
const socketToUser = new Map<string, SocketUserInfo>();

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow connections from configured origins or localhost in development
      const allowedOrigins = process.env['CORS_ORIGINS']?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4200',
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
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
    private readonly jwtService: JwtService
  ) {}

  /**
   * Handle new WebSocket connections with JWT authentication
   */
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or authorization header
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided (${client.id})`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token (${client.id})`);
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      // Determine user type (seller or user)
      const userType: ParticipantType =
        payload.userType === 'SELLER' ? 'seller' : 'user';

      // Store user info in map
      socketToUser.set(client.id, {
        userId: payload.userId,
        userType,
      });

      // Set user online in Redis
      await this.onlineRedisService.setUserOnline(payload.userId, client.id);

      this.logger.log(
        `Client connected: ${payload.userId} (${userType}) - Socket: ${client.id}`
      );

      client.emit('connected', {
        message: 'WebSocket connected successfully',
        userId: payload.userId,
        userType,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnections
   */
  async handleDisconnect(client: Socket) {
    const userInfo = socketToUser.get(client.id);
    if (userInfo) {
      socketToUser.delete(client.id);
      await this.onlineRedisService.setUserOffline(userInfo.userId);
      this.logger.log(
        `Client disconnected: ${userInfo.userId} (${userInfo.userType})`
      );
    }
  }

  /**
   * Emit a message to all clients in a conversation room
   */
  emitMessage(message: ChatMessageEventDto) {
    this.server.to(message.conversationId).emit('chat_message', message);
  }

  /**
   * Join a conversation room to receive messages
   */
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket
  ) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    client.join(conversationId);
    this.logger.log(
      `User ${userInfo.userId} joined conversation: ${conversationId}`
    );
    client.emit('joined_conversation', { conversationId });
  }

  /**
   * Leave a conversation room
   */
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket
  ) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    client.leave(conversationId);
    this.logger.log(
      `User ${userInfo.userId} left conversation: ${conversationId}`
    );
    client.emit('left_conversation', { conversationId });
  }

  /**
   * Handle heartbeat to refresh online status
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userInfo = socketToUser.get(client.id);
    if (userInfo) {
      await this.onlineRedisService.refreshUserOnline(userInfo.userId);
    }
  }

  /**
   * Send a message - senderId is extracted from JWT, not from payload
   */
  @SubscribeMessage('send_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessagePayload
  ) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    const { conversationId, content, attachments } = data;

    if (!conversationId || !content) {
      throw new WsException('conversationId and content are required');
    }

    try {
      const now = new Date().toISOString();
      const payload: ChatMessageEventDto = {
        conversationId,
        senderId: userInfo.userId, // From JWT, not from client
        senderType: userInfo.userType as 'user' | 'seller',
        content,
        createdAt: now,
        attachments: attachments?.map((a) => ({ url: a.url, type: a.type })),
      };

      await this.kafkaService.sendMessage(
        'chat.new_message',
        conversationId,
        payload
      );

      this.logger.log(
        `Message queued: ${userInfo.userId} -> ${conversationId}`
      );

      // Acknowledge message was queued
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

  /**
   * Mark messages as seen
   */
  @SubscribeMessage('mark_as_seen')
  async markAsSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkAsSeenDto
  ) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    const { conversationId } = data;

    await this.messageRedisService.clearUnseenCount(
      userInfo.userId,
      conversationId
    );

    this.logger.log(
      `Cleared unseen count for ${userInfo.userId} in ${conversationId}`
    );

    // Notify other participants that messages were seen
    this.server.to(conversationId).emit('messages_seen', {
      conversationId,
      userId: userInfo.userId,
      userType: userInfo.userType,
      seenAt: new Date().toISOString(),
    });

    return { status: 'seen' };
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload
  ) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    const { conversationId, isTyping } = data;

    // Broadcast typing status to other participants in the conversation
    client.to(conversationId).emit('user_typing', {
      conversationId,
      userId: userInfo.userId,
      userType: userInfo.userType,
      isTyping,
    });
  }

  /**
   * Check if a user is online
   */
  @SubscribeMessage('check_online')
  async handleCheckOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string
  ) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    const isOnline = await this.onlineRedisService.isUserOnline(userId);
    return { userId, isOnline };
  }

  /**
   * Verify JWT token and extract payload
   */
  private verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
      return decoded;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error}`);
      return null;
    }
  }
}
