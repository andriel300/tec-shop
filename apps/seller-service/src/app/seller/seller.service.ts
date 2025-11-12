import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SellerPrismaService } from '../../prisma/prisma.service';
import {
  CreateSellerProfileDto,
  CreateShopDto,
  UpdateShopDto,
} from '@tec-shop/dto';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(private prisma: SellerPrismaService) {}

  async createProfile(createProfileDto: CreateSellerProfileDto) {
    try {
      this.logger.log(`Creating seller profile - authId: ${createProfileDto.authId}, email: ${createProfileDto.email}`);
      const { authId, name, email, phoneNumber, country } = createProfileDto;

      // Check if seller profile already exists
      this.logger.debug(`Checking if seller profile already exists for authId: ${authId}`);
      const existingSeller = await this.prisma.seller.findUnique({
        where: { authId },
      });

      if (existingSeller) {
        this.logger.log(`Seller profile already exists - sellerId: ${existingSeller.id}`);
        return existingSeller;
      }

      // Create seller profile
      this.logger.debug('Creating new seller profile');
      const seller = await this.prisma.seller.create({
        data: {
          authId,
          name,
          email,
          phoneNumber,
          country,
          isVerified: true, // Verified through auth-service
        },
        include: {
          shop: true,
        },
      });

      this.logger.log(`Seller profile created successfully - sellerId: ${seller.id}, email: ${email}`);

      return seller;
    } catch (error) {
      this.logger.error(
        `Failed to create seller profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getProfile(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: {
        shop: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return seller;
  }

  async updateProfile(
    authId: string,
    updateData: Partial<CreateSellerProfileDto>
  ) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const updatedSeller = await this.prisma.seller.update({
      where: { authId },
      data: updateData,
      include: {
        shop: true,
      },
    });

    return updatedSeller;
  }

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

    // Create new shop with proper field mapping
    const newShop = await this.prisma.shop.create({
      data: {
        businessName: shopData.businessName,
        bio: shopData.bio,
        category: shopData.category,
        address: shopData.address,
        openingHours: shopData.openingHours,
        website: shopData.website,
        sellerId: seller.id,
        socialLinks: [], // Initialize as empty array
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
      // Update existing shop
      const updatedShop = await this.prisma.shop.update({
        where: { sellerId: seller.id },
        data: {
          businessName: shopData.businessName,
          bio: shopData.bio,
          category: shopData.category,
          address: shopData.address,
          openingHours: shopData.openingHours,
          website: shopData.website,
        },
      });
      return updatedShop;
    } else {
      // Create new shop if required fields are provided
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
          socialLinks: [],
        },
      });
      return newShop;
    }
  }

  async getShop(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: {
        shop: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return seller.shop;
  }

  async getDashboardData(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: {
        shop: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return {
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        isVerified: seller.isVerified,
        createdAt: seller.createdAt,
      },
      shop: seller.shop
        ? {
            id: seller.shop.id,
            businessName: seller.shop.businessName,
            category: seller.shop.category,
            rating: seller.shop.rating,
            totalOrders: seller.shop.totalOrders,
            isActive: seller.shop.isActive,
            createdAt: seller.shop.createdAt,
          }
        : null,
    };
  }

  // ============================================
  // Product Service Integration Methods
  // ============================================

  /**
   * Verify that a shop exists by its ID
   * Used by product-service to validate shopId references
   */
  async verifyShopExists(shopId: string): Promise<boolean> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });
    return !!shop;
  }

  /**
   * Get shop details by shop ID
   * Used by product-service to fetch shop information
   */
  async getShopById(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        seller: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  /**
   * Verify that a seller owns a specific shop
   * Used by product-service for authorization checks
   */
  async verifyShopOwnership(
    authId: string,
    shopId: string
  ): Promise<boolean> {
    try {
      this.logger.debug(`Verifying shop ownership - authId: ${authId}, shopId: ${shopId}`);

      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          seller: true,
        },
      });

      if (!shop) {
        this.logger.debug(`Shop not found: ${shopId}`);
        return false;
      }

      const owns = shop.seller.authId === authId;
      this.logger.debug(`Ownership verification result - authId: ${authId}, shop.seller.authId: ${shop.seller.authId}, owns: ${owns}`);

      return owns;
    } catch (error) {
      this.logger.error(
        `Failed to verify shop ownership: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      return false;
    }
  }

  /**
   * Get filtered shops for public marketplace
   * Supports search, category, country, and rating filters with pagination
   */
  async getFilteredShops(filters: {
    search?: string;
    category?: string;
    country?: string;
    minRating?: number;
    limit?: number;
    offset?: number;
  }) {
    try {
      this.logger.debug(`Fetching filtered shops with filters: ${JSON.stringify(filters)}`);

      // Build where clause for shop filtering
      const where: Record<string, unknown> = {
        isActive: true, // Only show active shops
      };

      // Search by business name
      if (filters.search) {
        where.businessName = {
          contains: filters.search,
          mode: 'insensitive',
        };
      }

      // Filter by category
      if (filters.category) {
        where.category = {
          contains: filters.category,
          mode: 'insensitive',
        };
      }

      // Filter by minimum rating
      if (filters.minRating !== undefined) {
        where.rating = {
          gte: filters.minRating,
        };
      }

      // Build where clause for seller (country filter)
      const sellerWhere: Record<string, unknown> = {};
      if (filters.country) {
        sellerWhere.country = {
          contains: filters.country,
          mode: 'insensitive',
        };
      }

      // Add seller filter to shop where clause if needed
      if (Object.keys(sellerWhere).length > 0) {
        where.seller = sellerWhere;
      }

      // Set pagination defaults
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
      const offset = filters.offset && filters.offset >= 0 ? filters.offset : 0;

      // Execute query with pagination
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
          orderBy: {
            rating: 'desc', // Order by highest rating first
          },
        }),
        this.prisma.shop.count({ where }),
      ]);

      this.logger.log(`Found ${shops.length} shops out of ${total} total matching filters`);

      return {
        shops,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch filtered shops: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
