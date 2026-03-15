import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SellerPrismaService } from '../../prisma/prisma.service';
import type { CreateShopDto, UpdateShopDto } from '@tec-shop/dto';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(
    private readonly prisma: SellerPrismaService,
    private readonly logProducer: LogProducerService
  ) {}

  async createShop(authId: string, shopData: CreateShopDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    if (seller.shop) {
      throw new BadRequestException('Shop already exists for this seller');
    }

    const newShop = await this.prisma.shop.create({
      data: {
        businessName: shopData.businessName,
        bio: shopData.bio,
        category: shopData.category,
        address: shopData.address,
        openingHours: shopData.openingHours,
        website: shopData.website,
        sellerId: seller.id,
        socialLinks: [],
      },
    });

    this.logProducer.info('seller-service', 'seller', 'Shop created', {
      userId: authId,
      sellerId: seller.id,
      metadata: {
        action: 'create_shop',
        shopId: newShop.id,
        businessName: shopData.businessName,
      },
    });

    return newShop;
  }

  async createOrUpdateShop(authId: string, shopData: UpdateShopDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    if (seller.shop) {
      const updatedShop = await this.prisma.shop.update({
        where: { sellerId: seller.id },
        data: {
          businessName: shopData.businessName,
          bio: shopData.bio,
          category: shopData.category,
          address: shopData.address,
          openingHours: shopData.openingHours,
          website: shopData.website,
          ...(shopData.isActive !== undefined && { isActive: shopData.isActive }),
          ...(shopData.socialLinks !== undefined && { socialLinks: shopData.socialLinks }),
          ...(shopData.returnPolicy !== undefined && { returnPolicy: shopData.returnPolicy }),
          ...(shopData.shippingPolicy !== undefined && { shippingPolicy: shopData.shippingPolicy }),
          ...(shopData.banner !== undefined && { banner: shopData.banner }),
          ...(shopData.logo !== undefined && { logo: shopData.logo }),
        },
      });
      this.logProducer.info('seller-service', 'seller', 'Shop updated', {
        userId: authId,
        sellerId: seller.id,
        metadata: { action: 'update_shop', shopId: updatedShop.id },
      });
      return updatedShop;
    }

    if (!shopData.businessName || !shopData.category || !shopData.address) {
      throw new BadRequestException(
        'businessName, category, and address are required to create a new shop'
      );
    }

    const newShop = await this.prisma.shop.create({
      data: {
        businessName: shopData.businessName,
        bio: shopData.bio,
        category: shopData.category,
        address: shopData.address,
        openingHours: shopData.openingHours || 'Please contact for hours',
        website: shopData.website,
        sellerId: seller.id,
        socialLinks: shopData.socialLinks || [],
        returnPolicy: shopData.returnPolicy,
        shippingPolicy: shopData.shippingPolicy,
      },
    });
    this.logProducer.info('seller-service', 'seller', 'Shop created', {
      userId: authId,
      sellerId: seller.id,
      metadata: {
        action: 'create_shop',
        shopId: newShop.id,
        businessName: shopData.businessName,
      },
    });
    return newShop;
  }

  async getShop(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return seller.shop;
  }

  async verifyShopExists(shopId: string): Promise<boolean> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    return !!shop;
  }

  async getShopById(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        seller: {
          select: {
            id: true,
            authId: true,
            name: true,
            country: true,
            isVerified: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async verifyShopOwnership(authId: string, shopId: string): Promise<boolean> {
    try {
      this.logger.debug(
        `Verifying shop ownership - authId: ${authId}, shopId: ${shopId}`
      );

      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
        include: { seller: true },
      });

      if (!shop) {
        this.logger.debug(`Shop not found: ${shopId}`);
        this.logProducer.warn(
          'seller-service',
          'seller',
          'Shop not found during ownership verification',
          { userId: authId, metadata: { action: 'verify_ownership', shopId } }
        );
        return false;
      }

      const owns = shop.seller.authId === authId;
      this.logger.debug(
        `Ownership verification result - authId: ${authId}, shop.seller.authId: ${shop.seller.authId}, owns: ${owns}`
      );

      if (!owns) {
        this.logProducer.warn(
          'seller-service',
          'seller',
          'Shop ownership verification failed',
          {
            userId: authId,
            metadata: {
              action: 'verify_ownership',
              shopId,
              actualOwner: shop.seller.authId,
            },
          }
        );
      }

      return owns;
    } catch (error) {
      this.logger.error(
        `Failed to verify shop ownership: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined
      );
      return false;
    }
  }

  async getFilteredShops(filters: {
    search?: string;
    category?: string;
    country?: string;
    minRating?: number;
    limit?: number;
    offset?: number;
  }) {
    try {
      this.logger.debug(
        `Fetching filtered shops with filters: ${JSON.stringify(filters)}`
      );

      const where: Record<string, unknown> = { isActive: true };

      if (filters.search) {
        where.businessName = { contains: filters.search, mode: 'insensitive' };
      }
      if (filters.category) {
        where.category = { contains: filters.category, mode: 'insensitive' };
      }
      if (filters.minRating !== undefined) {
        where.rating = { gte: filters.minRating };
      }

      const sellerWhere: Record<string, unknown> = {};
      if (filters.country) {
        sellerWhere.country = { contains: filters.country, mode: 'insensitive' };
      }
      if (Object.keys(sellerWhere).length > 0) {
        where.seller = sellerWhere;
      }

      const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
      const offset = filters.offset && filters.offset >= 0 ? filters.offset : 0;

      const [shops, total] = await Promise.all([
        this.prisma.shop.findMany({
          where,
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                country: true,
                isVerified: true,
              },
            },
          },
          take: limit,
          skip: offset,
          orderBy: { rating: 'desc' },
        }),
        this.prisma.shop.count({ where }),
      ]);

      this.logger.log(
        `Found ${shops.length} shops out of ${total} total matching filters`
      );

      return { shops, total, limit, offset };
    } catch (error) {
      this.logger.error(
        `Failed to fetch filtered shops: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getStatistics(authId: string) {
    this.logger.log(`Getting statistics for seller authId: ${authId}`);

    try {
      const seller = await this.prisma.seller.findUnique({
        where: { authId },
        include: { shop: true },
      });

      if (!seller) {
        throw new NotFoundException('Seller profile not found');
      }

      if (!seller.shop) {
        return {
          revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
          orders: { total: 0, pending: 0, completed: 0, cancelled: 0, thisMonth: 0 },
          products: { total: 0, active: 0, outOfStock: 0 },
          shop: { rating: 0, totalOrders: 0, isActive: false },
        };
      }

      return {
        revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        orders: {
          total: seller.shop.totalOrders,
          pending: 0,
          completed: 0,
          cancelled: 0,
          thisMonth: 0,
        },
        products: { total: 0, active: 0, outOfStock: 0 },
        shop: {
          rating: seller.shop.rating,
          totalOrders: seller.shop.totalOrders,
          isActive: seller.shop.isActive,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get seller statistics: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
