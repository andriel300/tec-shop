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
}
