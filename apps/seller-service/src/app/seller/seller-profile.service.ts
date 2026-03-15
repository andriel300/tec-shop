import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SellerPrismaService } from '../../prisma/prisma.service';
import type { CreateSellerProfileDto } from '@tec-shop/dto';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class SellerProfileService {
  private readonly logger = new Logger(SellerProfileService.name);

  constructor(
    private readonly prisma: SellerPrismaService,
    private readonly logProducer: LogProducerService
  ) {}

  async createProfile(createProfileDto: CreateSellerProfileDto) {
    try {
      this.logger.log(
        `Creating seller profile - authId: ${createProfileDto.authId}, email: ${createProfileDto.email}`
      );
      const { authId, name, email, phoneNumber, country } = createProfileDto;

      this.logger.debug(
        `Checking if seller profile already exists for authId: ${authId}`
      );
      const existingSeller = await this.prisma.seller.findUnique({
        where: { authId },
      });

      if (existingSeller) {
        this.logger.log(
          `Seller profile already exists - sellerId: ${existingSeller.id}`
        );
        return existingSeller;
      }

      this.logger.debug('Creating new seller profile');
      const seller = await this.prisma.seller.create({
        data: {
          authId,
          name,
          email,
          phoneNumber,
          country,
          isVerified: true,
        },
        include: {
          shop: true,
        },
      });

      this.logger.log(
        `Seller profile created successfully - sellerId: ${seller.id}, email: ${email}`
      );
      this.logProducer.info(
        'seller-service',
        'seller',
        'Seller profile created',
        {
          userId: authId,
          sellerId: seller.id,
          metadata: { action: 'create_profile' },
        }
      );

      return seller;
    } catch (error) {
      this.logger.error(
        `Failed to create seller profile: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getProfile(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        country: true,
        isVerified: true,
        stripeOnboardingStatus: true,
        stripeDetailsSubmitted: true,
        stripePayoutsEnabled: true,
        stripeChargesEnabled: true,
        stripeLastUpdated: true,
        notificationPreferences: true,
        createdAt: true,
        updatedAt: true,
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

    return this.prisma.seller.update({
      where: { authId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        country: true,
        isVerified: true,
        stripeOnboardingStatus: true,
        stripeDetailsSubmitted: true,
        stripePayoutsEnabled: true,
        stripeChargesEnabled: true,
        stripeLastUpdated: true,
        notificationPreferences: true,
        createdAt: true,
        updatedAt: true,
        shop: true,
      },
    });
  }

  async getDashboardData(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
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

  async updateNotificationPreferences(
    authId: string,
    preferences: Record<string, boolean>
  ) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const updatedSeller = await this.prisma.seller.update({
      where: { authId },
      data: { notificationPreferences: preferences },
    });

    this.logProducer.info(
      'seller-service',
      'seller',
      'Notification preferences updated',
      {
        userId: authId,
        sellerId: seller.id,
        metadata: { action: 'update_notification_preferences' },
      }
    );

    return updatedSeller.notificationPreferences;
  }

  async getNotificationPreferences(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return seller.notificationPreferences ?? {};
  }
}
