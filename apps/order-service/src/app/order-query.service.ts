import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma, OrderStatus as PrismaOrderStatus } from '@tec-shop/order-client';
import { OrderPrismaService } from '../prisma/prisma.service';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import { GetSellerOrdersDto, OrderStatus } from '@tec-shop/dto';
import { UserServiceClient } from '../clients/user.client';
import { AuthServiceClient } from '../clients/auth.client';

@Injectable()
export class OrderQueryService {
  private readonly logger = new Logger(OrderQueryService.name);

  constructor(
    private readonly prisma: OrderPrismaService,
    private readonly notificationProducer: NotificationProducerService,
    private readonly userClient: UserServiceClient,
    private readonly authClient: AuthServiceClient,
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

    // Enrich orders with customer name and email from user/auth services
    const uniqueUserIds = [...new Set(orders.map((o) => o.userId))];

    const customerMap = new Map<string, { name?: string; email?: string }>();

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const [profile, auth] = await Promise.all([
          this.userClient.getUserProfile(userId),
          this.authClient.getUserEmail(userId),
        ]);
        customerMap.set(userId, {
          name: (profile?.['name'] as string | undefined) ?? undefined,
          email: auth?.email ?? undefined,
        });
      })
    );

    const enrichedOrders = orders.map((order) => ({
      ...order,
      customerName: customerMap.get(order.userId)?.name,
      customerEmail: customerMap.get(order.userId)?.email,
    }));

    return {
      data: enrichedOrders,
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
    // Email data is passed in metadata — notification-service handles email sending
    try {
      const orderNumber = (updatedOrder as Record<string, unknown>).orderNumber as string;
      const shippingAddr = order.shippingAddress as Record<string, unknown>;
      const customerName = (shippingAddr.name as string | undefined) ?? 'Customer';
      const authResult = await this.authClient.getUserEmail(order.userId);
      const customerEmail = authResult?.email ?? undefined;

      if (status === OrderStatus.SHIPPED) {
        await this.notificationProducer.notifyCustomer(
          order.userId,
          'order.shipped',
          { orderNumber, trackingNumber: trackingNumber || 'N/A' },
          { orderId, email: customerEmail, customerName, orderNumber, trackingNumber: trackingNumber || undefined }
        );
      } else if (status === OrderStatus.DELIVERED) {
        const items = updatedOrder.items as Array<{ productName: string }>;
        const productNames = items.map((item) => item.productName).join(', ');

        await this.notificationProducer.notifyCustomer(
          order.userId,
          'order.delivered',
          { orderNumber },
          { orderId, email: customerEmail, customerName, orderNumber }
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

  async confirmDelivery(
    userId: string,
    orderId: string
  ): Promise<Record<string, unknown>> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new RpcException({
        statusCode: 400,
        message: 'Order cannot be confirmed — it has not been shipped yet',
      });
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
      include: { items: true },
    });

    this.logger.log(`Order ${orderId} confirmed as delivered by customer ${userId}`);

    try {
      const orderNumber = (updatedOrder as Record<string, unknown>).orderNumber as string;
      const items = updatedOrder.items as Array<{ productName: string; sellerId: string }>;
      const productNames = items.map((i) => i.productName).join(', ');
      const shippingAddr = order.shippingAddress as Record<string, unknown>;
      const customerName = (shippingAddr.name as string | undefined) ?? 'Customer';
      const authResult = await this.authClient.getUserEmail(userId);
      const customerEmail = authResult?.email ?? undefined;

      await this.notificationProducer.notifyCustomer(
        userId,
        'order.delivered',
        { orderNumber },
        { orderId, email: customerEmail, customerName, orderNumber }
      );
      await this.notificationProducer.notifyCustomer(
        userId,
        'order.delivered_review',
        { orderNumber, productNames },
        { orderId }
      );

      // Notify each unique seller whose items are in this order
      const sellerIds = [...new Set(items.map((i) => i.sellerId))];
      await Promise.all(
        sellerIds.map((sellerId) =>
          this.notificationProducer.notifySeller(
            sellerId,
            'order.delivered_seller',
            { orderNumber },
            { orderId, orderNumber }
          )
        )
      );
    } catch (notifError) {
      this.logger.warn(
        `Failed to send delivery confirmation notification for order ${orderId}: ${notifError instanceof Error ? notifError.message : 'Unknown error'}`
      );
    }

    return updatedOrder;
  }

  async getSellerStatistics(payload: { sellerId: string }) {
    const { sellerId } = payload;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const PAID_STATUSES = [PrismaOrderStatus.PAID, PrismaOrderStatus.SHIPPED, PrismaOrderStatus.DELIVERED];
    const PENDING_STATUSES = [PrismaOrderStatus.PENDING, PrismaOrderStatus.PAID, PrismaOrderStatus.SHIPPED];

    const [totalRev, thisMonthRev, lastMonthRev, total, pending, completed, cancelled, thisMonth] =
      await Promise.all([
        this.prisma.orderItem.aggregate({
          where: { sellerId, order: { status: { in: PAID_STATUSES } } },
          _sum: { sellerPayout: true },
        }),
        this.prisma.orderItem.aggregate({
          where: {
            sellerId,
            createdAt: { gte: startOfThisMonth },
            order: { status: { in: PAID_STATUSES } },
          },
          _sum: { sellerPayout: true },
        }),
        this.prisma.orderItem.aggregate({
          where: {
            sellerId,
            createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
            order: { status: { in: PAID_STATUSES } },
          },
          _sum: { sellerPayout: true },
        }),
        this.prisma.order.count({ where: { items: { some: { sellerId } } } }),
        this.prisma.order.count({
          where: { items: { some: { sellerId } }, status: { in: PENDING_STATUSES } },
        }),
        this.prisma.order.count({
          where: { items: { some: { sellerId } }, status: PrismaOrderStatus.DELIVERED },
        }),
        this.prisma.order.count({
          where: { items: { some: { sellerId } }, status: PrismaOrderStatus.CANCELLED },
        }),
        this.prisma.order.count({
          where: { items: { some: { sellerId } }, createdAt: { gte: startOfThisMonth } },
        }),
      ]);

    const totalRevenue = totalRev._sum?.sellerPayout ?? 0;
    const thisMonthRevenue = thisMonthRev._sum?.sellerPayout ?? 0;
    const lastMonthRevenue = lastMonthRev._sum?.sellerPayout ?? 0;

    const growth =
      lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
        : thisMonthRevenue > 0
          ? 100
          : 0;

    return {
      revenue: {
        total: totalRevenue,       // in cents — frontend divides by 100
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth,
      },
      orders: { total, pending, completed, cancelled, thisMonth },
    };
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
        orders: ordersByMonth.get(key)?.size ?? 0,
      })),
      orderStatusData: [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Cancelled', value: cancelled, color: '#ef4444' },
      ],
    };
  }
}
