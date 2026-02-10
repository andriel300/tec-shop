import {
  Controller,
  Inject,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
  Patch,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import type { Request } from 'express';
import type {
  NotificationListResponseDto,
  NotificationResponseDto,
  NotificationType,
} from '@tec-shop/dto';

interface AuthenticatedUser {
  userId: string;
  username: string;
  role?: string;
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
}

const USER_TYPE_MAP: Record<string, string> = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

@ApiTags('User Notifications')
@Controller('user-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserNotificationController {
  private readonly logger = new Logger(UserNotificationController.name);

  constructor(
    @Inject('LOGGER_SERVICE') private readonly loggerService: ClientProxy
  ) {}

  private getTargetInfo(req: Request): { targetType: string; targetId: string } {
    const user = req.user as AuthenticatedUser;
    const rawType = user.userType || user.role || 'CUSTOMER';
    const targetType = USER_TYPE_MAP[rawType.toUpperCase()] || 'customer';
    return { targetType, targetId: user.userId };
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isRead', required: false })
  @ApiQuery({ name: 'type', required: false })
  async getNotifications(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: NotificationType
  ): Promise<NotificationListResponseDto> {
    const { targetType, targetId } = this.getTargetInfo(req);

    return firstValueFrom(
      this.loggerService.send('notification-get-list', {
        targetType,
        targetId,
        query: { page, limit, isRead, type },
      })
    );
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(
    @Req() req: Request
  ): Promise<{ count: number }> {
    const { targetType, targetId } = this.getTargetInfo(req);

    return firstValueFrom(
      this.loggerService.send('notification-get-unread-count', {
        targetType,
        targetId,
      })
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Req() req: Request,
    @Param('id') notificationId: string
  ): Promise<NotificationResponseDto> {
    const { targetType, targetId } = this.getTargetInfo(req);

    return firstValueFrom(
      this.loggerService.send('notification-mark-as-read', {
        targetType,
        targetId,
        notificationId,
      })
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(
    @Req() req: Request
  ): Promise<{ message: string; count: number }> {
    const { targetType, targetId } = this.getTargetInfo(req);

    return firstValueFrom(
      this.loggerService.send('notification-mark-all-read', {
        targetType,
        targetId,
      })
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(
    @Req() req: Request,
    @Param('id') notificationId: string
  ): Promise<{ message: string }> {
    const { targetType, targetId } = this.getTargetInfo(req);

    return firstValueFrom(
      this.loggerService.send('notification-delete', {
        targetType,
        targetId,
        notificationId,
      })
    );
  }
}
