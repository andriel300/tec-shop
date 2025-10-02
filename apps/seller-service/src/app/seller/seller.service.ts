import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SellerPrismaService } from '../../prisma/prisma.service';
import { CreateSellerProfileDto, CreateShopDto, UpdateShopDto } from '@tec-shop/dto';

@Injectable()
export class SellerService {
  constructor(private prisma: SellerPrismaService) {}

  async createProfile(createProfileDto: CreateSellerProfileDto) {
    const { authId, name, email, phoneNumber, country } = createProfileDto;

    // Check if seller profile already exists
    const existingSeller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (existingSeller) {
      return existingSeller;
    }

    // Create seller profile
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

    return seller;
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

  async updateProfile(authId: string, updateData: Partial<CreateSellerProfileDto>) {
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
        throw new BadRequestException('businessName, category, and address are required to create a new shop');
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
      shop: seller.shop ? {
        id: seller.shop.id,
        businessName: seller.shop.businessName,
        category: seller.shop.category,
        rating: seller.shop.rating,
        totalOrders: seller.shop.totalOrders,
        isActive: seller.shop.isActive,
        createdAt: seller.shop.createdAt,
      } : null,
    };
  }
}