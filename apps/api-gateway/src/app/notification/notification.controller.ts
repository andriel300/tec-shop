import {
  Body,
  Controller,
  Inject,
  Get,
  Post,
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
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CreateNotificationDto } from '@tec-shop/dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
@ApiBearerAuth()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a notification (System use)',
    description: 'Create a notification for a seller - typically called by the system',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Creating notification for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-create-notification', {
        authId: user.userId,
        notificationData: createNotificationDto,
      })
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all notifications',
    description: 'Retrieve all notifications for the authenticated seller',
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ORDER', 'PRODUCT', 'SHOP', 'SYSTEM'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number' },
        unreadCount: { type: 'number' },
      },
    },
  })
  async getNotifications(
    @Req() req: Record<string, unknown>,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Fetching notifications for seller authId: ${user.userId}`);

    const filters: Record<string, unknown> = {};
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (type) filters.type = type;
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    return firstValueFrom(
      this.sellerService.send('seller-get-notifications', {
        authId: user.userId,
        filters,
      })
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async getNotificationById(
    @Param('id') notificationId: string,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Fetching notification ${notificationId} for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-get-notification-by-id', {
        authId: user.userId,
        notificationId,
      })
    );
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markAsRead(
    @Param('id') notificationId: string,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Marking notification ${notificationId} as read for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-mark-notification-as-read', {
        authId: user.userId,
        notificationId,
      })
    );
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications as read for the authenticated seller',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Req() req: Record<string, unknown>) {
    const user = req.user as { userId: string };
    this.logger.log(`Marking all notifications as read for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-mark-all-notifications-as-read', user.userId)
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'Delete a notification by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async deleteNotification(
    @Param('id') notificationId: string,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Deleting notification ${notificationId} for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-delete-notification', {
        authId: user.userId,
        notificationId,
      })
    );
  }
}
