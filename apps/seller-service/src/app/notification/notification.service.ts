import { Injectable, Logger, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@tec-shop/seller-client';
import type { CreateNotificationDto, NotificationResponse } from '@tec-shop/dto';

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log('Notification Service - Prisma connected');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log('Notification Service - Prisma disconnected');
  }

  /**
   * Create a notification for a seller
   * This can be called by the system to notify sellers of important events
   */
  async createNotification(authId: string, createNotificationDto: CreateNotificationDto): Promise<NotificationResponse> {
    this.logger.log(`Creating notification for authId: ${authId}`);

    // Get seller
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    // Create notification
    const notification = await this.prisma.notification.create({
      data: {
        sellerId: seller.id,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        type: createNotificationDto.type || 'INFO',
        isRead: createNotificationDto.isRead ?? false,
        metadata: createNotificationDto.metadata || {},
      },
    });

    this.logger.log(`Notification created successfully: ${notification.id}`);
    return this.mapNotificationToResponse(notification);
  }

  /**
   * Get all notifications for a seller
   */
  async getNotifications(authId: string, filters?: {
    isRead?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: NotificationResponse[]; total: number; unreadCount: number }> {
    this.logger.log(`Getting notifications for authId: ${authId}`);

    // Get seller
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    // Build filter query
    const where: Record<string, unknown> = {
      sellerId: seller.id,
    };

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    // Get notifications with pagination
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { sellerId: seller.id, isRead: false },
      }),
    ]);

    this.logger.log(`Found ${total} notifications (${unreadCount} unread) for seller`);
    return {
      data: notifications.map(this.mapNotificationToResponse),
      total,
      unreadCount,
    };
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(authId: string, notificationId: string): Promise<NotificationResponse> {
    this.logger.log(`Getting notification ${notificationId} for authId: ${authId}`);

    // Get seller
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    // Get notification
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        sellerId: seller.id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.mapNotificationToResponse(notification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(authId: string, notificationId: string): Promise<NotificationResponse> {
    this.logger.log(`Marking notification ${notificationId} as read for authId: ${authId}`);

    // Verify ownership first
    await this.getNotificationById(authId, notificationId);

    // Update notification
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    this.logger.log(`Notification marked as read: ${notification.id}`);
    return this.mapNotificationToResponse(notification);
  }

  /**
   * Mark all notifications as read for a seller
   */
  async markAllAsRead(authId: string): Promise<{ message: string; count: number }> {
    this.logger.log(`Marking all notifications as read for authId: ${authId}`);

    // Get seller
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    // Update all unread notifications
    const result = await this.prisma.notification.updateMany({
      where: {
        sellerId: seller.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    this.logger.log(`Marked ${result.count} notifications as read`);
    return {
      message: 'All notifications marked as read',
      count: result.count,
    };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(authId: string, notificationId: string): Promise<{ message: string }> {
    this.logger.log(`Deleting notification ${notificationId} for authId: ${authId}`);

    // Verify ownership first
    await this.getNotificationById(authId, notificationId);

    // Delete notification
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    this.logger.log(`Notification deleted successfully: ${notificationId}`);
    return { message: 'Notification deleted successfully' };
  }

  /**
   * Map Prisma notification to NotificationResponse
   */
  private mapNotificationToResponse(notification: Record<string, unknown>): NotificationResponse {
    return {
      id: notification.id as string,
      sellerId: notification.sellerId as string,
      title: notification.title as string,
      message: notification.message as string,
      type: notification.type as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ORDER' | 'PRODUCT' | 'SHOP' | 'SYSTEM',
      isRead: notification.isRead as boolean,
      metadata: notification.metadata as Record<string, unknown> | null | undefined,
      createdAt: notification.createdAt as Date,
      updatedAt: notification.updatedAt as Date,
    };
  }
}
