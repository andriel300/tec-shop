import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  AuthPrismaService,
  UserPrismaService,
  SellerPrismaService,
  OrderPrismaService,
} from '../../prisma/prisma.service';
import type {
  ListUsersDto,
  BanUserDto,
  CreateAdminDto,
  ListSellersDto,
  UpdateSellerVerificationDto,
  ListOrdersDto,
  UpdateLayoutDto,
  CreateHeroSlideDto,
  UpdateHeroSlideDto,
} from '@tec-shop/dto';
import { NotificationProducerService } from '@tec-shop/notification-producer';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly authPrisma: AuthPrismaService,
    private readonly userPrisma: UserPrismaService,
    private readonly sellerPrisma: SellerPrismaService,
    private readonly orderPrisma: OrderPrismaService,
    private readonly notificationProducer: NotificationProducerService
  ) {}

  // ============ User Management Methods ============

  /**
   * List all users with pagination and filters
   */
  async listUsers(dto: ListUsersDto) {
    this.logger.log(`Listing users with filters: ${JSON.stringify(dto)}`);

    const { search, userType, status } = dto;
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (userType) {
      where.userType = userType;
    }

    if (status) {
      where.isBanned = status === 'BANNED';
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries
    const [users, total] = await Promise.all([
      this.authPrisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          userType: true,
          isEmailVerified: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.authPrisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(userId: string) {
    this.logger.log(`Fetching details for user: ${userId}`);

    const user = await this.authPrisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userType: true,
        isEmailVerified: true,
        isBanned: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user is a customer, get user profile
    let userProfile = null;
    if (user.userType === 'CUSTOMER') {
      userProfile = await this.userPrisma.userProfile.findUnique({
        where: { userId: userId },
      });
    }

    // If user is a seller, get seller profile
    let sellerProfile = null;
    if (user.userType === 'SELLER') {
      sellerProfile = await this.sellerPrisma.seller.findUnique({
        where: { authId: userId },
        include: { shop: true },
      });
    }

    return {
      ...user,
      profile: userProfile || sellerProfile,
    };
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, dto: BanUserDto) {
    this.logger.log(`Banning user: ${userId}, reason: ${dto.reason}`);

    const user = await this.authPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.userType === 'ADMIN') {
      throw new BadRequestException('Cannot ban admin users');
    }

    if (user.isBanned) {
      throw new BadRequestException('User is already banned');
    }

    const updatedUser = await this.authPrisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
      },
      select: {
        id: true,
        email: true,
        isBanned: true,
      },
    });

    this.logger.log(`User ${userId} banned successfully`);

    // Notify the banned user
    if (user.userType === 'CUSTOMER') {
      this.notificationProducer.notifyCustomer(userId, 'system.account_banned', {});
    } else if (user.userType === 'SELLER') {
      this.notificationProducer.notifySeller(userId, 'system.account_banned', {});
    }

    return updatedUser;
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string) {
    this.logger.log(`Unbanning user: ${userId}`);

    const user = await this.authPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBanned) {
      throw new BadRequestException('User is not banned');
    }

    const updatedUser = await this.authPrisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
      },
      select: {
        id: true,
        email: true,
        isBanned: true,
      },
    });

    this.logger.log(`User ${userId} unbanned successfully`);

    // Notify the unbanned user
    if (user.userType === 'CUSTOMER') {
      this.notificationProducer.notifyCustomer(userId, 'system.account_unbanned', {});
    } else if (user.userType === 'SELLER') {
      this.notificationProducer.notifySeller(userId, 'system.account_unbanned', {});
    }

    return updatedUser;
  }

  // ============ Admin Team Management Methods ============

  /**
   * List all admin users
   */
  async listAdmins() {
    this.logger.log('Listing all admin users');

    const admins = await this.authPrisma.user.findMany({
      where: { userType: 'ADMIN' },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins;
  }

  /**
   * Create a new admin user
   */
  async createAdmin(dto: CreateAdminDto) {
    this.logger.log(`Creating new admin: ${dto.email}`);

    // Check if user already exists
    const existingUser = await this.authPrisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create admin user
    const admin = await this.authPrisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        userType: 'ADMIN',
        isEmailVerified: true, // Admins are auto-verified
      },
      select: {
        id: true,
        email: true,
        userType: true,
        createdAt: true,
      },
    });

    this.logger.log(`Admin created successfully: ${admin.id}`);
    return admin;
  }

  /**
   * Delete an admin user
   */
  async deleteAdmin(adminId: string) {
    this.logger.log(`Deleting admin: ${adminId}`);

    const admin = await this.authPrisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.userType !== 'ADMIN') {
      throw new BadRequestException('User is not an admin');
    }

    // Check if this is the last admin
    const adminCount = await this.authPrisma.user.count({
      where: { userType: 'ADMIN' },
    });

    if (adminCount <= 1) {
      throw new BadRequestException(
        'Cannot delete the last admin user. At least one admin must exist.'
      );
    }

    await this.authPrisma.user.delete({
      where: { id: adminId },
    });

    this.logger.log(`Admin ${adminId} deleted successfully`);
    return { message: 'Admin deleted successfully' };
  }

  // ============ Seller Management Methods ============

  /**
   * List all sellers with pagination and filters
   */
  async listSellers(dto: ListSellersDto) {
    this.logger.log(`Listing sellers with filters: ${JSON.stringify(dto)}`);

    const { search, isVerified } = dto;
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries
    const [sellers, total] = await Promise.all([
      this.sellerPrisma.seller.findMany({
        where,
        skip,
        take: limit,
        include: {
          shop: {
            select: {
              id: true,
              businessName: true,
              category: true,
              isActive: true,
              rating: true,
              totalOrders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.sellerPrisma.seller.count({ where }),
    ]);

    // Enrich with auth data
    const sellersWithAuth = await Promise.all(
      sellers.map(async (seller) => {
        const authUser = await this.authPrisma.user.findUnique({
          where: { id: seller.authId },
          select: {
            email: true,
            isEmailVerified: true,
            createdAt: true,
          },
        });

        return {
          ...seller,
          auth: authUser,
        };
      })
    );

    return {
      data: sellersWithAuth,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update seller verification status
   */
  async updateSellerVerification(
    sellerId: string,
    dto: UpdateSellerVerificationDto
  ) {
    this.logger.log(
      `Updating seller ${sellerId} verification to: ${dto.isVerified}`
    );

    const seller = await this.sellerPrisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const updatedSeller = await this.sellerPrisma.seller.update({
      where: { id: sellerId },
      data: { isVerified: dto.isVerified },
      include: { shop: true },
    });

    this.logger.log(`Seller ${sellerId} verification updated successfully`);

    // Notify the seller about verification status change
    this.notificationProducer.notifySeller(
      seller.authId,
      'seller.verification_update',
      { status: dto.isVerified ? 'verified' : 'unverified' }
    );

    return updatedSeller;
  }

  // ============ Order Management Methods ============

  /**
   * List all orders with pagination and filters
   */
  async listAllOrders(dto: ListOrdersDto) {
    this.logger.log(`Listing all orders with filters: ${JSON.stringify(dto)}`);

    const { status, paymentStatus, startDate, endDate } = dto;
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
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
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Execute queries
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

  /**
   * Get platform-wide statistics for admin dashboard
   */
  async getStatistics() {
    this.logger.log('Fetching platform statistics');

    // User statistics
    const [totalUsers, totalCustomers, totalSellers, totalAdmins] =
      await Promise.all([
        this.authPrisma.user.count(),
        this.authPrisma.user.count({ where: { userType: 'CUSTOMER' } }),
        this.authPrisma.user.count({ where: { userType: 'SELLER' } }),
        this.authPrisma.user.count({ where: { userType: 'ADMIN' } }),
      ]);

    // Seller statistics
    const [verifiedSellers, activeShops] = await Promise.all([
      this.sellerPrisma.seller.count({ where: { isVerified: true } }),
      this.sellerPrisma.shop.count({ where: { isActive: true } }),
    ]);

    // Order statistics
    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      this.orderPrisma.order.count(),
      this.orderPrisma.order.count({ where: { status: 'PENDING' } }),
      this.orderPrisma.order.count({ where: { status: 'DELIVERED' } }),
    ]);

    // Revenue statistics
    const revenueData = await this.orderPrisma.order.aggregate({
      where: { paymentStatus: 'COMPLETED' },
      _sum: {
        finalAmount: true,
        platformFee: true,
      },
    });

    const totalRevenue = revenueData._sum.finalAmount || 0;
    const totalPlatformFee = revenueData._sum.platformFee || 0;

    // Geographic distribution - Sellers by country
    const sellersByCountry = await this.sellerPrisma.seller.groupBy({
      by: ['country'],
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: 'desc',
        },
      },
    });

    // Geographic distribution - Users by country (from shipping addresses)
    const usersByCountry = await this.userPrisma.shippingAddress.groupBy({
      by: ['country'],
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: 'desc',
        },
      },
    });

    // Combine geographic data into a unified format
    const countryMap = new Map<string, { users: number; sellers: number }>();

    // Add seller counts
    for (const item of sellersByCountry) {
      const country = item.country;
      if (!countryMap.has(country)) {
        countryMap.set(country, { users: 0, sellers: 0 });
      }
      const data = countryMap.get(country);
      if (data) {
        data.sellers = item._count.country;
      }
    }

    // Add user counts
    for (const item of usersByCountry) {
      const country = item.country;
      if (!countryMap.has(country)) {
        countryMap.set(country, { users: 0, sellers: 0 });
      }
      const data = countryMap.get(country);
      if (data) {
        data.users = item._count.country;
      }
    }

    // Convert to array format
    const geographicDistribution = Array.from(countryMap.entries()).map(
      ([country, counts]) => ({
        country,
        users: counts.users,
        sellers: counts.sellers,
      })
    );

    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        sellers: totalSellers,
        admins: totalAdmins,
      },
      sellers: {
        verified: verifiedSellers,
        activeShops,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
      },
      revenue: {
        total: totalRevenue,
        platformFee: totalPlatformFee,
      },
      geographicDistribution,
    };
  }

  // ============ Site Layout Methods ============

  async getLayout() {
    this.logger.log('Fetching site layout');

    const includeHeroSlides = {
      heroSlides: { orderBy: { order: 'asc' as const } },
    };

    // Return the first (and only) SiteLayout record, or create a default one
    let layout = await this.userPrisma.siteLayout.findFirst({
      include: includeHeroSlides,
    });

    if (!layout) {
      layout = await this.userPrisma.siteLayout.create({
        data: {},
        include: includeHeroSlides,
      });
      this.logger.log('Created default site layout');
    }

    return { layout };
  }

  async updateLayout(dto: UpdateLayoutDto) {
    this.logger.log(`Updating site layout: ${JSON.stringify(dto)}`);

    // Get or create the layout record
    let layout = await this.userPrisma.siteLayout.findFirst();

    if (!layout) {
      layout = await this.userPrisma.siteLayout.create({
        data: {
          logo: dto.logo,
          banner: dto.banner,
        },
      });
    } else {
      layout = await this.userPrisma.siteLayout.update({
        where: { id: layout.id },
        data: {
          logo: dto.logo,
          banner: dto.banner,
        },
      });
    }

    this.logger.log('Site layout updated successfully');
    return { layout };
  }

  // ============ Hero Slide Methods ============

  private async getOrCreateSiteLayout() {
    let layout = await this.userPrisma.siteLayout.findFirst();
    if (!layout) {
      layout = await this.userPrisma.siteLayout.create({ data: {} });
      this.logger.log('Created default site layout for hero slide');
    }
    return layout;
  }

  async createHeroSlide(dto: CreateHeroSlideDto) {
    this.logger.log(`Creating hero slide: ${dto.title}`);

    const layout = await this.getOrCreateSiteLayout();

    const slide = await this.userPrisma.heroSlide.create({
      data: {
        siteLayoutId: layout.id,
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        actionUrl: dto.actionUrl,
        actionLabel: dto.actionLabel,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Hero slide created: ${slide.id}`);
    return slide;
  }

  async updateHeroSlide(slideId: string, dto: UpdateHeroSlideDto) {
    this.logger.log(`Updating hero slide: ${slideId}`);

    const existing = await this.userPrisma.heroSlide.findUnique({
      where: { id: slideId },
    });

    if (!existing) {
      throw new NotFoundException('Hero slide not found');
    }

    const updated = await this.userPrisma.heroSlide.update({
      where: { id: slideId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.actionUrl !== undefined && { actionUrl: dto.actionUrl }),
        ...(dto.actionLabel !== undefined && { actionLabel: dto.actionLabel }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Hero slide updated: ${slideId}`);
    return updated;
  }

  async deleteHeroSlide(slideId: string) {
    this.logger.log(`Deleting hero slide: ${slideId}`);

    const existing = await this.userPrisma.heroSlide.findUnique({
      where: { id: slideId },
    });

    if (!existing) {
      throw new NotFoundException('Hero slide not found');
    }

    await this.userPrisma.heroSlide.delete({
      where: { id: slideId },
    });

    this.logger.log(`Hero slide deleted: ${slideId}`);
    return { message: 'Hero slide deleted successfully' };
  }

  async reorderHeroSlides(slideIds: string[]) {
    this.logger.log(`Reordering hero slides: ${slideIds.length} slides`);

    const updates = slideIds.map((id, index) =>
      this.userPrisma.heroSlide.update({
        where: { id },
        data: { order: index },
      })
    );

    await Promise.all(updates);

    this.logger.log('Hero slides reordered successfully');
    return { message: 'Hero slides reordered successfully' };
  }
}
