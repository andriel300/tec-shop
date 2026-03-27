import { Injectable, Logger } from '@nestjs/common';
import {
  AuthPrismaService,
  UserPrismaService,
  SellerPrismaService,
  OrderPrismaService,
} from '../../prisma/prisma.service';
import type { ListOrdersDto } from '@tec-shop/dto';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly authPrisma: AuthPrismaService,
    private readonly userPrisma: UserPrismaService,
    private readonly sellerPrisma: SellerPrismaService,
    private readonly orderPrisma: OrderPrismaService
  ) {}

  async listAllOrders(dto: ListOrdersDto) {
    this.logger.log(`Listing all orders with filters: ${JSON.stringify(dto)}`);

    const { status, paymentStatus, startDate, endDate } = dto;
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.orderPrisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          payouts: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.orderPrisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingCounts(): Promise<{
    unverifiedSellers: number;
    pendingOrders: number;
    failedPayments: number;
  }> {
    const [unverifiedSellers, pendingOrders, failedPayments] = await Promise.all([
      this.sellerPrisma.seller.count({ where: { isVerified: false } }),
      this.orderPrisma.order.count({ where: { status: 'PENDING' } }),
      this.orderPrisma.order.count({ where: { paymentStatus: 'FAILED' } }),
    ]);
    return { unverifiedSellers, pendingOrders, failedPayments };
  }

  async getStatistics() {
    this.logger.log('Fetching platform statistics');

    const [totalUsers, totalCustomers, totalSellers, totalAdmins] = await Promise.all([
      this.authPrisma.user.count(),
      this.authPrisma.user.count({ where: { userType: 'CUSTOMER' } }),
      this.authPrisma.user.count({ where: { userType: 'SELLER' } }),
      this.authPrisma.user.count({ where: { userType: 'ADMIN' } }),
    ]);

    const [verifiedSellers, activeShops] = await Promise.all([
      this.sellerPrisma.seller.count({ where: { isVerified: true } }),
      this.sellerPrisma.shop.count({ where: { isActive: true } }),
    ]);

    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      this.orderPrisma.order.count(),
      this.orderPrisma.order.count({ where: { status: 'PENDING' } }),
      this.orderPrisma.order.count({ where: { status: 'DELIVERED' } }),
    ]);

    const revenueData = await this.orderPrisma.order.aggregate({
      where: { paymentStatus: 'COMPLETED' },
      _sum: {
        finalAmount: true,
        platformFee: true,
      },
    });

    const totalRevenue = revenueData._sum.finalAmount || 0;
    const totalPlatformFee = revenueData._sum.platformFee || 0;

    // Build the last-6-months label list (oldest → newest, English short names)
    const monthLabels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toLocaleString('en-US', { month: 'short' }));
    }

    // Monthly revenue for completed orders — $queryRaw because Prisma groupBy
    // does not support date_trunc. BigInt is returned by PostgreSQL for COUNT/SUM.
    const rawMonthly = await this.orderPrisma.$queryRaw<
      Array<{ month: string; orders: bigint; revenue: bigint }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
        COUNT(*)::bigint                                  AS orders,
        COALESCE(SUM("finalAmount"), 0)::bigint           AS revenue
      FROM "Order"
      WHERE "createdAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
        AND "paymentStatus" = 'COMPLETED'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;

    const monthlyMap = new Map(rawMonthly.map((r) => [r.month, r]));
    const monthlySales = monthLabels.map((month) => ({
      month,
      orders: Number(monthlyMap.get(month)?.orders ?? 0),
      revenue: Number(monthlyMap.get(month)?.revenue ?? 0),
    }));

    const sellersByCountry = await this.sellerPrisma.seller.groupBy({
      by: ['country'],
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
    });

    // Count distinct users per country (not address count — one user may have multiple addresses)
    const allAddresses = await this.userPrisma.shippingAddress.findMany({
      select: { userId: true, country: true },
      where: { country: { not: '' } },
    });

    const userSetByCountry = new Map<string, Set<string>>();
    for (const addr of allAddresses) {
      if (!addr.country) continue;
      if (!userSetByCountry.has(addr.country)) {
        userSetByCountry.set(addr.country, new Set());
      }
      userSetByCountry.get(addr.country)!.add(addr.userId);
    }

    const countryMap = new Map<string, { users: number; sellers: number }>();

    for (const item of sellersByCountry) {
      const country = item.country;
      if (!country) continue;
      if (!countryMap.has(country)) {
        countryMap.set(country, { users: 0, sellers: 0 });
      }
      countryMap.get(country)!.sellers = item._count.country;
    }

    for (const [country, userSet] of userSetByCountry) {
      if (!countryMap.has(country)) {
        countryMap.set(country, { users: 0, sellers: 0 });
      }
      countryMap.get(country)!.users = userSet.size;
    }

    const geographicDistribution = Array.from(countryMap.entries()).map(
      ([country, counts]) => ({ country, users: counts.users, sellers: counts.sellers })
    );

    return {
      users: { total: totalUsers, customers: totalCustomers, sellers: totalSellers, admins: totalAdmins },
      sellers: { verified: verifiedSellers, activeShops },
      orders: { total: totalOrders, pending: pendingOrders, completed: completedOrders },
      revenue: { total: totalRevenue, platformFee: totalPlatformFee },
      monthlySales,
      geographicDistribution,
    };
  }
}
