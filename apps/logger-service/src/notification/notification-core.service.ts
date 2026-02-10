import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LoggerPrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type {
  NotificationEventDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationQueryDto,
} from '@tec-shop/dto';

const UNREAD_COUNT_KEY_PREFIX = 'notification:unread:';
const UNREAD_COUNT_TTL = 300;

@Injectable()
export class NotificationCoreService {
  private readonly logger = new Logger(NotificationCoreService.name);

  constructor(
    private readonly prisma: LoggerPrismaService,
    private readonly redis: RedisService
  ) {}

  async saveNotification(
    dto: NotificationEventDto
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        templateId: dto.templateId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        metadata: dto.metadata ?? undefined,
      },
    });

    await this.invalidateUnreadCountCache(dto.targetType, dto.targetId);

    return this.mapToResponse(notification);
  }

  async getNotifications(
    targetType: string,
    targetId: string,
    query: NotificationQueryDto
  ): Promise<NotificationListResponseDto> {
    const page =
      typeof query.page === 'string'
        ? parseInt(query.page, 10)
        : (query.page ?? 1);
    const limit =
      typeof query.limit === 'string'
        ? parseInt(query.limit, 10)
        : (query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      targetType,
      targetId,
    };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead === 'true';
    }

    if (query.type) {
      where.type = query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { targetType, targetId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((n) => this.mapToResponse(n)),
      total,
      unreadCount,
      page,
      limit,
    };
  }

  async getUnreadCount(targetType: string, targetId: string): Promise<number> {
    const cacheKey = `${UNREAD_COUNT_KEY_PREFIX}${targetType}:${targetId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) {
        return parseInt(cached, 10);
      }
    } catch (_error) {
      this.logger.warn('Failed to get cached unread count');
    }

    const count = await this.prisma.notification.count({
      where: { targetType, targetId, isRead: false },
    });

    try {
      await this.redis.set(cacheKey, count.toString(), UNREAD_COUNT_TTL);
    } catch (_error) {
      this.logger.warn('Failed to cache unread count');
    }

    return count;
  }

  async markAsRead(
    targetType: string,
    targetId: string,
    notificationId: string
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, targetType, targetId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    await this.invalidateUnreadCountCache(targetType, targetId);

    return this.mapToResponse(updated);
  }

  async markAllAsRead(
    targetType: string,
    targetId: string
  ): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { targetType, targetId, isRead: false },
      data: { isRead: true },
    });

    await this.invalidateUnreadCountCache(targetType, targetId);

    return { count: result.count };
  }

  async deleteNotification(
    targetType: string,
    targetId: string,
    notificationId: string
  ): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, targetType, targetId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    if (!notification.isRead) {
      await this.invalidateUnreadCountCache(targetType, targetId);
    }
  }

  private async invalidateUnreadCountCache(
    targetType: string,
    targetId: string
  ): Promise<void> {
    try {
      const cacheKey = `${UNREAD_COUNT_KEY_PREFIX}${targetType}:${targetId}`;
      await this.redis.set(cacheKey, '', 1);
    } catch (_error) {
      // Cache invalidation failure is not critical
    }
  }

  private mapToResponse(
    notification: Record<string, unknown>
  ): NotificationResponseDto {
    return {
      id: notification.id as string,
      targetType: notification.targetType as NotificationResponseDto['targetType'],
      targetId: notification.targetId as string,
      templateId: notification.templateId as string,
      title: notification.title as string,
      message: notification.message as string,
      type: notification.type as NotificationResponseDto['type'],
      isRead: notification.isRead as boolean,
      metadata: notification.metadata as Record<string, unknown> | undefined,
      createdAt: (notification.createdAt as Date).toISOString(),
    };
  }
}
