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
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MonoPrismaService } from '../prisma/prisma.service';

interface SocketUser {
  userId: string;
  userType: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly socketToUser = new Map<string, SocketUser>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: MonoPrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Extract token from auth handshake or cookies
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`WS connection rejected: no token (${client.id})`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      let payload: { sub: string; userType: string; username: string; role: string };
      try {
        payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
      } catch {
        this.logger.warn(`WS connection rejected: invalid token (${client.id})`);
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      const userType = payload.userType === 'SELLER' ? 'seller' : 'customer';
      this.socketToUser.set(client.id, { userId: payload.sub, userType });

      this.logger.log(`WS connected: ${payload.sub} (${userType}) socket=${client.id}`);
      client.emit('connected', {
        message: 'WebSocket connected',
        userId: payload.sub,
        userType,
      });
    } catch (error) {
      this.logger.error(`WS connection error: ${error}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user = this.socketToUser.get(client.id);
    if (user) {
      this.socketToUser.delete(client.id);
      this.logger.log(`WS disconnected: ${user.userId} (${user.userType})`);
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): void {
    const user = this.socketToUser.get(client.id);
    if (!user) throw new WsException('Not authenticated');
    client.join(conversationId);
    this.logger.log(`${user.userId} joined room ${conversationId}`);
    client.emit('joined_conversation', { conversationId });
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): void {
    const user = this.socketToUser.get(client.id);
    if (!user) throw new WsException('Not authenticated');
    client.leave(conversationId);
    this.logger.log(`${user.userId} left room ${conversationId}`);
    client.emit('left_conversation', { conversationId });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ): Promise<void> {
    const user = this.socketToUser.get(client.id);
    if (!user) throw new WsException('Not authenticated');

    const { conversationId, content } = data;
    if (!conversationId || !content?.trim()) {
      throw new WsException('conversationId and content are required');
    }

    try {
      // Save to database
      const message = await this.prisma.chatMessage.create({
        data: {
          conversationId,
          senderId: user.userId,
          senderType: user.userType.toUpperCase(),
          content: content.trim(),
          status: 'sent',
        },
      });

      // Broadcast to all in the room
      this.server.to(conversationId).emit('chat_message', {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderType: message.senderType,
        content: message.content,
        attachments: [],
        createdAt: message.createdAt.toISOString(),
      });

      this.logger.log(`Message sent: ${user.userId} -> ${conversationId}`);
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ): void {
    const user = this.socketToUser.get(client.id);
    if (!user) throw new WsException('Not authenticated');

    client.to(data.conversationId).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.userId,
      userType: user.userType,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_as_seen')
  async handleMarkAsSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): Promise<void> {
    const user = this.socketToUser.get(client.id);
    if (!user) throw new WsException('Not authenticated');

    const { conversationId } = data;
    const field = user.userType === 'customer' ? 'userId' : 'sellerId';
    const participant = await this.prisma.chatParticipant.findFirst({
      where: { conversationId, [field]: user.userId },
    });

    if (participant) {
      await this.prisma.chatParticipant.update({
        where: { id: participant.id },
        data: { lastSeenAt: new Date(), unreadCount: 0 },
      });
    }

    this.server.to(conversationId).emit('messages_seen', {
      conversationId,
      userId: user.userId,
      userType: user.userType,
      seenAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket): void {
    const user = this.socketToUser.get(client.id);
    if (user) {
      client.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
    }
  }

  private extractToken(client: Socket): string | null {
    // Try handshake auth
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token as string;
    }
    // Try auth header
    if (client.handshake.headers?.authorization) {
      const auth = client.handshake.headers.authorization as string;
      const parts = auth.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
    }
    return null;
  }
}
