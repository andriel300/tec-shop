import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderPrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@tec-shop/dto';

@Injectable()
export class MockLogisticsService {
  private readonly logger = new Logger(MockLogisticsService.name);

  constructor(private readonly prisma: OrderPrismaService) {}

  /**
   * Mock logistics service that automatically advances order status
   * Runs every 2 minutes to simulate delivery progress
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processDeliveryUpdates() {
    this.logger.log('Running mock logistics service...');

    try {
      // Find orders that are PAID and older than 5 minutes -> mark as SHIPPED
      const paidOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PAID,
          createdAt: {
            lt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          },
        },
      });

      for (const order of paidOrders) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.SHIPPED,
            trackingNumber: this.generateTrackingNumber(),
          },
        });
        this.logger.log(`Order ${order.orderNumber} marked as SHIPPED`);
      }

      // Find orders that are SHIPPED and older than 10 minutes -> mark as DELIVERED
      const shippedOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.SHIPPED,
          updatedAt: {
            lt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          },
        },
      });

      for (const order of shippedOrders) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.DELIVERED,
            deliveredAt: new Date(),
          },
        });
        this.logger.log(`Order ${order.orderNumber} marked as DELIVERED`);
      }
    } catch (error) {
      this.logger.error('Error in mock logistics service', error);
    }
  }

  private generateTrackingNumber(): string {
    const prefix = 'TRK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Manually trigger status update for testing
   */
  async manualUpdate(orderId: string, status: OrderStatus): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.SHIPPED &&
        !(await this.hasTrackingNumber(orderId))
          ? { trackingNumber: this.generateTrackingNumber() }
          : {}),
        ...(status === OrderStatus.DELIVERED
          ? { deliveredAt: new Date() }
          : {}),
      },
    });
    this.logger.log(`Manually updated order ${orderId} to ${status}`);
  }

  private async hasTrackingNumber(orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { trackingNumber: true },
    });
    return !!order?.trackingNumber;
  }
}
