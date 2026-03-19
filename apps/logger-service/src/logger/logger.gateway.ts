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
import { Injectable, Logger, UsePipes, UseFilters, ValidationPipe, Inject, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Redis } from 'ioredis';
import type { LogEntryResponseDto, LogLevel, LogCategory } from '@tec-shop/dto';
import { LoggerCoreService } from './logger-core.service';
import { WsJwtPayload, extractWsToken, WsExceptionFilter } from '@tec-shop/ws-auth';

interface AdminSocketInfo {
  adminId: string;
  filters?: LogSubscriptionFilters;
}

interface LogSubscriptionFilters {
  services?: string[];
  levels?: LogLevel[];
  categories?: LogCategory[];
}

@Injectable()
@WebSocketGateway()
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe())
export class LoggerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LoggerGateway.name);
  private readonly socketToAdmin = new Map<string, AdminSocketInfo>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly loggerCore: LoggerCoreService,
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

      if (payload.userType !== 'ADMIN' && payload.role !== 'ADMIN') {
        this.logger.warn(
          `Connection rejected: Not an admin (${client.id}) - userType: ${payload.userType}, role: ${payload.role}`
        );
        client.emit('error', { message: 'Admin access required' });
        client.disconnect();
        return;
      }

      this.socketToAdmin.set(client.id, { adminId: payload.sub });
      client.join('admin-logs');

      this.logger.log(`Admin connected: ${payload.sub} - Socket: ${client.id}`);

      client.emit('connected', {
        message: 'WebSocket connected successfully',
        adminId: payload.sub,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const adminInfo = this.socketToAdmin.get(client.id);
    if (adminInfo) {
      this.socketToAdmin.delete(client.id);
      this.logger.log(`Admin disconnected: ${adminInfo.adminId}`);
    }
  }

  broadcastLog(log: LogEntryResponseDto): void {
    // Emit to the admin-logs room so all admin replicas receive it via Redis adapter
    this.server.to('admin-logs').emit('log_entry', log);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { filters?: LogSubscriptionFilters },
    @ConnectedSocket() client: Socket
  ): Promise<{ status: string }> {
    const adminInfo = this.socketToAdmin.get(client.id);
    if (!adminInfo) throw new WsException('Not authenticated');

    adminInfo.filters = data.filters;
    this.socketToAdmin.set(client.id, adminInfo);

    this.logger.log(
      `Admin ${adminInfo.adminId} subscribed with filters: ${JSON.stringify(data.filters)}`
    );

    const recentLogs = await this.loggerCore.getRecentLogs(50);
    const filteredLogs = recentLogs.filter((log) => this.matchesFilters(log, data.filters));

    client.emit('subscribed', {
      message: 'Subscribed to log stream',
      filters: data.filters,
      recentLogs: filteredLogs,
    });

    return { status: 'subscribed' };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket): { status: string } {
    const adminInfo = this.socketToAdmin.get(client.id);
    if (!adminInfo) throw new WsException('Not authenticated');

    adminInfo.filters = undefined;
    this.socketToAdmin.set(client.id, adminInfo);

    this.logger.log(`Admin ${adminInfo.adminId} unsubscribed`);

    client.emit('unsubscribed', { message: 'Unsubscribed from log stream' });

    return { status: 'unsubscribed' };
  }

  @SubscribeMessage('update_filters')
  handleUpdateFilters(
    @MessageBody() data: { filters: LogSubscriptionFilters },
    @ConnectedSocket() client: Socket
  ): { status: string } {
    const adminInfo = this.socketToAdmin.get(client.id);
    if (!adminInfo) throw new WsException('Not authenticated');

    adminInfo.filters = data.filters;
    this.socketToAdmin.set(client.id, adminInfo);

    this.logger.log(
      `Admin ${adminInfo.adminId} updated filters: ${JSON.stringify(data.filters)}`
    );

    client.emit('filters_updated', { message: 'Filters updated', filters: data.filters });

    return { status: 'filters_updated' };
  }

  private matchesFilters(
    log: LogEntryResponseDto,
    filters?: LogSubscriptionFilters
  ): boolean {
    if (!filters) return true;

    if (filters.services?.length && !filters.services.includes(log.service)) return false;
    if (filters.levels?.length && !filters.levels.includes(log.level)) return false;
    if (filters.categories?.length && !filters.categories.includes(log.category)) return false;

    return true;
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
