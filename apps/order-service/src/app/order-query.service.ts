import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@tec-shop/order-client';
import { OrderPrismaService } from '../prisma/prisma.service';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import { GetSellerOrdersDto, OrderStatus } from '@tec-shop/dto';

@Injectable()
export class OrderQueryService {
  private readonly logger = new Logger(OrderQueryService.name);

  constructor(
    private readonly prisma: OrderPrismaService,
    private readonly notificationProducer: NotificationProducerService
  ) {}

  async getUserOrders(userId: string): Promise<Record<string, unknown>[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async getSellerOrders(query: GetSellerOrdersDto) {
    const {
      sellerId,
      status,
      paymentStatus,
      shopId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    if (!sellerId) {
      throw new BadRequestException('sellerId is required');
    }

    this.logger.log(`Fetching orders for sellerId: ${sellerId}`);

    const where: Prisma.OrderWhereInput = {
      items: {
        some: {
          sellerId,
          ...(shopId ? { shopId } : {}),
        },
      },
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    this.logger.debug(`Query filter: ${JSON.stringify(where)}`);

    const skip = (page - 1) * limit;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            where: { sellerId },
          },
          payouts: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      this.prisma.order.count({ where }),
    ]);

    this.logger.log(`Found ${total} orders for seller ${sellerId}`);

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(
    userId: string,
    orderId: string
  ): Promise<Record<string, unknown>> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payouts: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrderByNumber(
    userId: string,
    orderNumber: string
  ): Promise<Record<string, unknown>> {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrderDetailsForSeller(
    sellerId: string | null,
    orderId: string
  ): Promise<Record<string, unknown>> {
    const isAdmin = !sellerId;

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(isAdmin ? {} : { items: { some: { sellerId: sellerId! } } }),
      },
      include: {
        items: isAdmin ? true : { where: { sellerId: sellerId! } },
        payouts: isAdmin ? true : { where: { sellerId: sellerId! } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateDeliveryStatus(
    sellerId: string | null,
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<Record<string, unknown>> {
    const isAdmin = !sellerId;

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(isAdmin ? {} : { items: { some: { sellerId: sellerId! } } }),
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(trackingNumber ? { trackingNumber } : {}),
      },
      include: {
        items: true,
      },
    });

    this.logger.log(`Order ${orderId} status updated to ${status} by ${sellerId ? `seller ${sellerId}` : 'admin'}`);

    // Send customer notification for each order status transition
    try {
      const orderNumber = (updatedOrder as Record<string, unknown>).orderNumber as string;

      if (status === OrderStatus.SHIPPED) {
        await this.notificationProducer.notifyCustomer(
          order.userId,
          'order.shipped',
          { orderNumber, trackingNumber: trackingNumber || 'N/A' },
          { orderId }
        );
      } else if (status === OrderStatus.DELIVERED) {
        const items = updatedOrder.items as Array<{ productName: string }>;
        const productNames = items.map((item) => item.productName).join(', ');

        await this.notificationProducer.notifyCustomer(
          order.userId,
          'order.delivered',
          { orderNumber },
          { orderId }
        );
        await this.notificationProducer.notifyCustomer(
          order.userId,
          'order.delivered_review',
          { orderNumber, productNames },
          { orderId }
        );
      } else if (status === OrderStatus.CANCELLED) {
        await this.notificationProducer.notifyCustomer(
          order.userId,
          'order.cancelled',
          { orderNumber },
          { orderId }
        );
      }
    } catch (notifError) {
      this.logger.warn(
        `Failed to send order status notification for order ${orderId}: ${notifError instanceof Error ? notifError.message : 'Unknown error'}`
      );
    }

    return updatedOrder;
  }
}
