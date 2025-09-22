import { Injectable, NotFoundException } from '@nestjs/common';
import { SellerPrismaService } from '../../prisma/prisma.service';

interface CreateSellerProfileDto {
  authId: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
}

interface UpdateShopDto {
  businessName: string;
  description?: string;
  category: string;
  address: string;
  website?: string;
  socialLinks?: any[];
}

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
        data: shopData,
      });
      return updatedShop;
    } else {
      // Create new shop
      const newShop = await this.prisma.shop.create({
        data: {
          ...shopData,
          sellerId: seller.id,
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