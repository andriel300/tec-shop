import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  AuthPrismaService,
  SellerPrismaService,
} from '../../prisma/prisma.service';
import type {
  ListSellersDto,
  UpdateSellerVerificationDto,
} from '@tec-shop/dto';
import { NotificationProducerService } from '@tec-shop/notification-producer';

@Injectable()
export class AdminSellersService {
  private readonly logger = new Logger(AdminSellersService.name);

  constructor(
    private readonly authPrisma: AuthPrismaService,
    private readonly sellerPrisma: SellerPrismaService,
    private readonly notificationProducer: NotificationProducerService
  ) {}

  async listSellers(dto: ListSellersDto) {
    this.logger.log(`Listing sellers with filters: ${JSON.stringify(dto)}`);

    const { search, isVerified } = dto;
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

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

    const [sellers, total] = await Promise.all([
      this.sellerPrisma.seller.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          authId: true,
          name: true,
          email: true,
          phoneNumber: true,
          country: true,
          isVerified: true,
          stripeOnboardingStatus: true,
          stripePayoutsEnabled: true,
          createdAt: true,
          updatedAt: true,
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
        return { ...seller, auth: authUser };
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

  async updateSellerVerification(sellerId: string, dto: UpdateSellerVerificationDto) {
    this.logger.log(`Updating seller ${sellerId} verification to: ${dto.isVerified}`);

    const seller = await this.sellerPrisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const updatedSeller = await this.sellerPrisma.seller.update({
      where: { id: sellerId },
      data: { isVerified: dto.isVerified },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        shop: {
          select: {
            id: true,
            businessName: true,
            isActive: true,
          },
        },
      },
    });

    this.logger.log(`Seller ${sellerId} verification updated successfully`);

    this.notificationProducer.notifySeller(
      seller.authId,
      'seller.verification_update',
      { status: dto.isVerified ? 'verified' : 'unverified' }
    );

    return updatedSeller;
  }
}
