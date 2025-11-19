import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import type { CreateNotificationDto } from '@tec-shop/dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern('seller-create-notification')
  async createNotification(
    @Payload()
    payload: { authId: string; notificationData: CreateNotificationDto }
  ) {
    return this.notificationService.createNotification(
      payload.authId,
      payload.notificationData
    );
  }

  @MessagePattern('seller-get-notifications')
  async getNotifications(
    @Payload()
    payload: {
      authId: string;
      filters?: {
        isRead?: boolean;
        type?: string;
        limit?: number;
        offset?: number;
      };
    }
  ) {
    return this.notificationService.getNotifications(
      payload.authId,
      payload.filters
    );
  }

  @MessagePattern('seller-get-notification-by-id')
  async getNotificationById(
    @Payload() payload: { authId: string; notificationId: string }
  ) {
    return this.notificationService.getNotificationById(
      payload.authId,
      payload.notificationId
    );
  }

  @MessagePattern('seller-mark-notification-as-read')
  async markAsRead(
    @Payload() payload: { authId: string; notificationId: string }
  ) {
    return this.notificationService.markAsRead(
      payload.authId,
      payload.notificationId
    );
  }

  @MessagePattern('seller-mark-all-notifications-as-read')
  async markAllAsRead(@Payload() authId: string) {
    return this.notificationService.markAllAsRead(authId);
  }

  @MessagePattern('seller-delete-notification')
  async deleteNotification(
    @Payload() payload: { authId: string; notificationId: string }
  ) {
    return this.notificationService.deleteNotification(
      payload.authId,
      payload.notificationId
    );
  }
}
