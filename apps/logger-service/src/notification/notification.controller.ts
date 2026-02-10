import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationCoreService } from './notification-core.service';
import type {
  NotificationQueryDto,
  NotificationResponseDto,
  NotificationListResponseDto,
} from '@tec-shop/dto';

@Controller()
export class NotificationTcpController {
  private readonly logger = new Logger(NotificationTcpController.name);

  constructor(private readonly notificationCore: NotificationCoreService) {}

  @MessagePattern('notification-get-list')
  async getNotifications(
    @Payload()
    data: {
      targetType: string;
      targetId: string;
      query: NotificationQueryDto;
    }
  ): Promise<NotificationListResponseDto> {
    this.logger.log(
      `Getting notifications for ${data.targetType}:${data.targetId}`
    );
    return this.notificationCore.getNotifications(
      data.targetType,
      data.targetId,
      data.query
    );
  }

  @MessagePattern('notification-get-unread-count')
  async getUnreadCount(
    @Payload() data: { targetType: string; targetId: string }
  ): Promise<{ count: number }> {
    const count = await this.notificationCore.getUnreadCount(
      data.targetType,
      data.targetId
    );
    return { count };
  }

  @MessagePattern('notification-mark-as-read')
  async markAsRead(
    @Payload()
    data: {
      targetType: string;
      targetId: string;
      notificationId: string;
    }
  ): Promise<NotificationResponseDto> {
    this.logger.log(`Marking notification ${data.notificationId} as read`);
    return this.notificationCore.markAsRead(
      data.targetType,
      data.targetId,
      data.notificationId
    );
  }

  @MessagePattern('notification-mark-all-read')
  async markAllAsRead(
    @Payload() data: { targetType: string; targetId: string }
  ): Promise<{ message: string; count: number }> {
    this.logger.log(
      `Marking all notifications as read for ${data.targetType}:${data.targetId}`
    );
    const result = await this.notificationCore.markAllAsRead(
      data.targetType,
      data.targetId
    );
    return { message: 'All notifications marked as read', count: result.count };
  }

  @MessagePattern('notification-delete')
  async deleteNotification(
    @Payload()
    data: {
      targetType: string;
      targetId: string;
      notificationId: string;
    }
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting notification ${data.notificationId}`);
    await this.notificationCore.deleteNotification(
      data.targetType,
      data.targetId,
      data.notificationId
    );
    return { message: 'Notification deleted successfully' };
  }
}
