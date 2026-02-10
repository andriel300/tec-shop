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
import type { NotificationResponseDto } from '@tec-shop/dto';
import { NotificationCoreService } from './notification-core.service';

interface JwtPayload {
  sub: string;
  username: string;
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  role?: string;
  iat?: number;
  exp?: number;
}

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

const COOKIE_NAMES = [
  'admin_access_token',
  'seller_access_token',
  'customer_access_token',
];

const socketToUser = new Map<string, ConnectedUserInfo>();

@Injectable()
@WebSocketGateway(6012, {
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      const allowedOrigins = process.env['CORS_ORIGINS']?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
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
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationCore: NotificationCoreService
  ) {}

  private extractTokenFromCookies(cookieHeader: string): string | null {
    const isProduction = process.env.NODE_ENV === 'production';
    const prefix = isProduction ? '__Host-' : '';

    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split('=');
      const cookieName = name.trim();

      for (const baseName of COOKIE_NAMES) {
        if (cookieName === `${prefix}${baseName}`) {
          return decodeURIComponent(valueParts.join('='));
        }
      }
    }
    return null;
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (client.handshake.headers?.cookie
          ? this.extractTokenFromCookies(client.handshake.headers.cookie)
          : null);

      if (!token) {
        this.logger.warn(`Notification WS rejected: No token (${client.id})`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        this.logger.warn(
          `Notification WS rejected: Invalid token (${client.id})`
        );
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      const rawType = payload.userType || payload.role || '';
      const targetType = USER_TYPE_MAP[rawType.toUpperCase()] || 'customer';
      const room = `${targetType}:${payload.sub}`;

      await client.join(room);

      if (targetType === 'admin') {
        await client.join('admin:all');
      }

      socketToUser.set(client.id, {
        userId: payload.sub,
        userType: targetType,
        room,
      });

      const unreadCount = await this.notificationCore.getUnreadCount(
        targetType,
        payload.sub
      );

      this.logger.log(
        `Notification WS connected: ${targetType}:${payload.sub} (${client.id})`
      );

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

  handleDisconnect(client: Socket) {
    const userInfo = socketToUser.get(client.id);
    if (userInfo) {
      socketToUser.delete(client.id);
      this.logger.log(
        `Notification WS disconnected: ${userInfo.room} (${client.id})`
      );
    }
  }

  broadcastToUser(
    targetType: string,
    targetId: string,
    notification: NotificationResponseDto
  ): void {
    const room = `${targetType}:${targetId}`;
    this.server.to(room).emit('notification', notification);
  }

  broadcastToAllAdmins(notification: NotificationResponseDto): void {
    this.server.to('admin:all').emit('notification', notification);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    try {
      await this.notificationCore.markAsRead(
        userInfo.userType,
        userInfo.userId,
        data.notificationId
      );

      const unreadCount = await this.notificationCore.getUnreadCount(
        userInfo.userType,
        userInfo.userId
      );

      client.emit('unread_count', { count: unreadCount });
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error}`);
      throw new WsException('Failed to mark as read');
    }
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userInfo = socketToUser.get(client.id);
    if (!userInfo) {
      throw new WsException('Not authenticated');
    }

    try {
      await this.notificationCore.markAllAsRead(
        userInfo.userType,
        userInfo.userId
      );

      client.emit('unread_count', { count: 0 });
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error}`);
      throw new WsException('Failed to mark all as read');
    }
  }

  private verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error}`);
      return null;
    }
  }
}
