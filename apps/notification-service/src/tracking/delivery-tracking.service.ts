import { Injectable, Logger } from '@nestjs/common';
import { NotificationPrismaService } from '../prisma/prisma.service';

export type DeliveryChannel = 'EMAIL' | 'PUSH';
export type DeliveryStatus = 'SENT' | 'FAILED';

@Injectable()
export class DeliveryTrackingService {
  private readonly logger = new Logger(DeliveryTrackingService.name);

  constructor(private readonly prisma: NotificationPrismaService) {}

  async record(
    notificationId: string,
    channel: DeliveryChannel,
    status: DeliveryStatus,
    error?: string
  ): Promise<void> {
    try {
      await this.prisma.deliveryLog.create({
        data: {
          notificationId,
          channel,
          status,
          error: error ?? null,
          sentAt: status === 'SENT' ? new Date() : null,
        },
      });
    } catch (err) {
      // Tracking failure is non-critical — log but don't rethrow
      this.logger.warn(`Failed to record delivery log: ${err instanceof Error ? err.message : err}`);
    }
  }
}
