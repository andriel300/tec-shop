import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
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
      throw new RpcException({ statusCode: 400, message: 'sellerId is required' });
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
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
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
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
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
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
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
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
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

  async getSellerChartData(payload: { shopId: string; sellerId: string }) {
    const { sellerId } = payload;

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    // Build ordered list of last 6 months (year-month key + display label)
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()] };
    });

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const items = await this.prisma.orderItem.findMany({
      where: { sellerId, createdAt: { gte: sixMonthsAgo } },
      select: {
        orderId: true,
        sellerPayout: true,
        createdAt: true,
        order: { select: { status: true } },
      },
    });

    // Per-month revenue (cents) and unique order IDs
    const revenueByMonth = new Map<string, number>(months.map(({ key }) => [key, 0]));
    const ordersByMonth = new Map<string, Set<string>>(months.map(({ key }) => [key, new Set()]));

    // All unique orders seen → status for distribution chart
    const orderStatusMap = new Map<string, string>();

    for (const item of items) {
      const key = `${item.createdAt.getFullYear()}-${item.createdAt.getMonth()}`;

      if (revenueByMonth.has(key)) {
        if (['PAID', 'SHIPPED', 'DELIVERED'].includes(item.order.status)) {
          revenueByMonth.set(key, revenueByMonth.get(key)! + item.sellerPayout);
        }
        ordersByMonth.get(key)!.add(item.orderId);
      }

      orderStatusMap.set(item.orderId, item.order.status);
    }

    // Build status distribution from unique orders
    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    for (const status of orderStatusMap.values()) {
      if (status === 'DELIVERED') completed++;
      else if (['PENDING', 'PAID', 'SHIPPED'].includes(status)) pending++;
      else if (status === 'CANCELLED') cancelled++;
    }

    return {
      revenueData: months.map(({ key, label }) => ({
        month: label,
        revenue: Math.round((revenueByMonth.get(key) ?? 0) / 100),
      })),
      monthlyOrdersData: months.map(({ key, label }) => ({
        month: label,
        revenue: ordersByMonth.get(key)?.size ?? 0,
      })),
      orderStatusData: [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Cancelled', value: cancelled, color: '#ef4444' },
      ],
    };
  }
}
