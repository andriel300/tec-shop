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
import type { LogEntryResponseDto, LogLevel, LogCategory } from '@tec-shop/dto';
import { LoggerCoreService } from './logger-core.service';

interface JwtPayload {
  userId: string;
  username: string;
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  role?: string;
  iat?: number;
  exp?: number;
}

interface AdminSocketInfo {
  adminId: string;
  filters?: LogSubscriptionFilters;
}

interface LogSubscriptionFilters {
  services?: string[];
  levels?: LogLevel[];
  categories?: LogCategory[];
}

const socketToAdmin = new Map<string, AdminSocketInfo>();

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
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
export class LoggerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LoggerGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly loggerCore: LoggerCoreService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided (${client.id})`
        );
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

      if (payload.userType !== 'ADMIN' && payload.role !== 'ADMIN') {
        this.logger.warn(
          `Connection rejected: Not an admin (${client.id}) - userType: ${payload.userType}, role: ${payload.role}`
        );
        client.emit('error', { message: 'Admin access required' });
        client.disconnect();
        return;
      }

      socketToAdmin.set(client.id, {
        adminId: payload.userId,
      });

      this.logger.log(`Admin connected: ${payload.userId} - Socket: ${client.id}`);

      client.emit('connected', {
        message: 'WebSocket connected successfully',
        adminId: payload.userId,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const adminInfo = socketToAdmin.get(client.id);
    if (adminInfo) {
      socketToAdmin.delete(client.id);
      this.logger.log(`Admin disconnected: ${adminInfo.adminId}`);
    }
  }

  broadcastLog(log: LogEntryResponseDto) {
    for (const [socketId, adminInfo] of socketToAdmin.entries()) {
      if (this.matchesFilters(log, adminInfo.filters)) {
        this.server.to(socketId).emit('log_entry', log);
      }
    }
  }

  private matchesFilters(
    log: LogEntryResponseDto,
    filters?: LogSubscriptionFilters
  ): boolean {
    if (!filters) {
      return true;
    }

    if (filters.services?.length && !filters.services.includes(log.service)) {
      return false;
    }

    if (filters.levels?.length && !filters.levels.includes(log.level)) {
      return false;
    }

    if (
      filters.categories?.length &&
      !filters.categories.includes(log.category)
    ) {
      return false;
    }

    return true;
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { filters?: LogSubscriptionFilters },
    @ConnectedSocket() client: Socket
  ) {
    const adminInfo = socketToAdmin.get(client.id);
    if (!adminInfo) {
      throw new WsException('Not authenticated');
    }

    adminInfo.filters = data.filters;
    socketToAdmin.set(client.id, adminInfo);

    this.logger.log(
      `Admin ${adminInfo.adminId} subscribed with filters: ${JSON.stringify(data.filters)}`
    );

    const recentLogs = await this.loggerCore.getRecentLogs(50);
    const filteredLogs = recentLogs.filter((log) =>
      this.matchesFilters(log, data.filters)
    );

    client.emit('subscribed', {
      message: 'Subscribed to log stream',
      filters: data.filters,
      recentLogs: filteredLogs,
    });

    return { status: 'subscribed' };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    const adminInfo = socketToAdmin.get(client.id);
    if (!adminInfo) {
      throw new WsException('Not authenticated');
    }

    adminInfo.filters = undefined;
    socketToAdmin.set(client.id, adminInfo);

    this.logger.log(`Admin ${adminInfo.adminId} unsubscribed`);

    client.emit('unsubscribed', {
      message: 'Unsubscribed from log stream',
    });

    return { status: 'unsubscribed' };
  }

  @SubscribeMessage('update_filters')
  handleUpdateFilters(
    @MessageBody() data: { filters: LogSubscriptionFilters },
    @ConnectedSocket() client: Socket
  ) {
    const adminInfo = socketToAdmin.get(client.id);
    if (!adminInfo) {
      throw new WsException('Not authenticated');
    }

    adminInfo.filters = data.filters;
    socketToAdmin.set(client.id, adminInfo);

    this.logger.log(
      `Admin ${adminInfo.adminId} updated filters: ${JSON.stringify(data.filters)}`
    );

    client.emit('filters_updated', {
      message: 'Filters updated',
      filters: data.filters,
    });

    return { status: 'filters_updated' };
  }

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
