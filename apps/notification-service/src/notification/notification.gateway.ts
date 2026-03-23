import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import type { NotificationResponseDto } from '@tec-shop/dto';
import { NotificationCoreService } from './notification-core.service';
import { WsJwtPayload, extractWsToken, WsExceptionFilter } from '@tec-shop/ws-auth';
import type { NotificationSavedEvent } from '../channel/channel.service';

interface ConnectedUserInfo {
  userId: string;
  userType: string;
  room: string;
}

const USER_TYPE_MAP: Record<string, string> = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

@Injectable()
@WebSocketGateway()
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe())
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly socketToUser = new Map<string, ConnectedUserInfo>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationCore: NotificationCoreService,
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
        this.logger.warn(`Notification WS rejected: No token (${client.id})`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Notification WS rejected: Invalid token (${client.id})`);
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      const rawType = payload.userType ?? payload.role ?? '';
      const targetType = USER_TYPE_MAP[rawType.toUpperCase()] ?? 'customer';
      const room = `${targetType}:${payload.sub}`;

      await client.join(room);

      if (targetType === 'admin') {
        await client.join('admin:all');
      }

      this.socketToUser.set(client.id, { userId: payload.sub, userType: targetType, room });

      const unreadCount = await this.notificationCore.getUnreadCount(targetType, payload.sub);

      this.logger.log(`Notification WS connected: ${targetType}:${payload.sub} (${client.id})`);

      client.emit('connected', {
        message: 'Notification WebSocket connected',
        userId: payload.sub,
        userType: targetType,
        unreadCount,
      });
    } catch (error) {
      this.logger.error(`Notification WS connection error: ${error}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userInfo = this.socketToUser.get(client.id);
    if (userInfo) {
      this.socketToUser.delete(client.id);
      this.logger.log(`Notification WS disconnected: ${userInfo.room} (${client.id})`);
    }
  }

  @OnEvent('notification.saved')
  onNotificationSaved({ saved, dto }: NotificationSavedEvent): void {
    if (dto.targetType === 'admin' && dto.targetId === 'all') {
      this.broadcastToAllAdmins(saved);
    } else {
      this.broadcastToUser(dto.targetType, dto.targetId, saved);
    }
  }

  broadcastToUser(targetType: string, targetId: string, notification: NotificationResponseDto): void {
    this.server.to(`${targetType}:${targetId}`).emit('notification', notification);
  }

  broadcastToAllAdmins(notification: NotificationResponseDto): void {
    this.server.to('admin:all').emit('notification', notification);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket
  ): Promise<{ status: string }> {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    try {
      await this.notificationCore.markAsRead(userInfo.userType, userInfo.userId, data.notificationId);

      const unreadCount = await this.notificationCore.getUnreadCount(userInfo.userType, userInfo.userId);

      client.emit('unread_count', { count: unreadCount });
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error}`);
      throw new WsException('Failed to mark as read');
    }
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(
    @ConnectedSocket() client: Socket
  ): Promise<{ status: string }> {
    const userInfo = this.socketToUser.get(client.id);
    if (!userInfo) throw new WsException('Not authenticated');

    try {
      await this.notificationCore.markAllAsRead(userInfo.userType, userInfo.userId);
      client.emit('unread_count', { count: 0 });
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error}`);
      throw new WsException('Failed to mark all as read');
    }
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
