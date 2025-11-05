import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SellerPrismaService } from '../../prisma/prisma.service';
import type { CreateDiscountDto, UpdateDiscountDto } from '@tec-shop/dto';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: SellerPrismaService) {}

  /**
   * Create a new discount code for a seller
   */
  async create(dto: CreateDiscountDto) {
    // Validate sellerId is provided
    if (!dto.sellerId) {
      throw new BadRequestException('Seller ID is required');
    }

    // Find seller by authId (sellerId from JWT is actually the authId)
    const seller = await this.prisma.seller.findUnique({
      where: { authId: dto.sellerId },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Validate discount value
    if (dto.discountType === 'PERCENTAGE' && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
    if (dto.discountValue <= 0) {
      throw new BadRequestException('Discount value must be greater than 0');
    }

    // Clean the data: remove undefined values to avoid Prisma issues
    // Prisma expects null for optional fields, not undefined
    // IMPORTANT: Use seller.id (not dto.sellerId which is authId)
    const cleanedData = {
      sellerId: seller.id, // Use the actual Seller database ID
      publicName: dto.publicName,
      code: dto.code,
      description: dto.description ?? null,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      usageLimit: dto.usageLimit ?? null,
      maxUsesPerCustomer: dto.maxUsesPerCustomer ?? null,
      startDate: dto.startDate ?? undefined, // undefined uses Prisma default (now())
      endDate: dto.endDate ?? null,
      minimumPurchase: dto.minimumPurchase ?? null,
      isActive: dto.isActive ?? true,
    };

    // Let Prisma handle uniqueness constraint - fixes race condition
    try {
      return await this.prisma.discountCode.create({
        data: cleanedData,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      // Prisma unique constraint violation: P2002
      if (error.code === 'P2002') {
        throw new BadRequestException('Discount code already exists');
      }
      throw error;
    }
  }

  /**
   * Get all discount codes for a specific seller
   */
  async findAll(authId: string) {
    // Find seller by authId first
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return this.prisma.discountCode.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get a single discount code (with ownership check)
   */
  async findOne(id: string, authId: string) {
    // Find seller by authId first
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const discount = await this.prisma.discountCode.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount code not found');
    }

    // Security: Verify ownership using seller.id
    if (discount.sellerId !== seller.id) {
      throw new ForbiddenException('You do not own this discount code');
    }

    return discount;
  }

  /**
   * Update a discount code (with ownership check)
   */
  async update(id: string, dto: UpdateDiscountDto, authId: string) {
    // Check ownership first (findOne now handles authId lookup)
    const existing = await this.findOne(id, authId);

    // If updating code, check uniqueness
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.prisma.discountCode.findUnique({
        where: { code: dto.code },
      });
      if (codeExists) {
        throw new BadRequestException('Discount code already exists');
      }
    }

    // Validate discount value if provided
    if (dto.discountValue !== undefined) {
      if (
        dto.discountType === 'PERCENTAGE' &&
        dto.discountValue > 100
      ) {
        throw new BadRequestException('Percentage discount cannot exceed 100%');
      }
      if (dto.discountValue <= 0) {
        throw new BadRequestException('Discount value must be greater than 0');
      }
    }

    // Clean the data: remove undefined values and convert to null for Prisma
    const cleanedData: Record<string, unknown> = {};

    if (dto.publicName !== undefined) cleanedData.publicName = dto.publicName;
    if (dto.code !== undefined) cleanedData.code = dto.code;
    if (dto.description !== undefined) cleanedData.description = dto.description ?? null;
    if (dto.discountType !== undefined) cleanedData.discountType = dto.discountType;
    if (dto.discountValue !== undefined) cleanedData.discountValue = dto.discountValue;
    if (dto.usageLimit !== undefined) cleanedData.usageLimit = dto.usageLimit ?? null;
    if (dto.maxUsesPerCustomer !== undefined) cleanedData.maxUsesPerCustomer = dto.maxUsesPerCustomer ?? null;
    if (dto.startDate !== undefined) cleanedData.startDate = dto.startDate;
    if (dto.endDate !== undefined) cleanedData.endDate = dto.endDate ?? null;
    if (dto.minimumPurchase !== undefined) cleanedData.minimumPurchase = dto.minimumPurchase ?? null;
    if (dto.isActive !== undefined) cleanedData.isActive = dto.isActive;

    return this.prisma.discountCode.update({
      where: { id },
      data: cleanedData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete a discount code (with ownership check)
   */
  async remove(id: string, authId: string) {
    // Check ownership first (findOne now handles authId lookup)
    await this.findOne(id, authId);

    return this.prisma.discountCode.delete({
      where: { id },
    });
  }

  /**
   * Validate and apply a discount code
   * This will be used by the order service to check if a code is valid
   */
  async validateCode(code: string, orderValue: number) {
    const discount = await this.prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      throw new NotFoundException('Invalid discount code');
    }

    if (!discount.isActive) {
      throw new BadRequestException('This discount code is no longer active');
    }

    // Check validity period
    const now = new Date();
    if (discount.startDate > now) {
      throw new BadRequestException('This discount code is not yet valid');
    }
    if (discount.endDate && discount.endDate < now) {
      throw new BadRequestException('This discount code has expired');
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      throw new BadRequestException('This discount code has reached its usage limit');
    }

    // Check minimum purchase
    if (discount.minimumPurchase && orderValue < discount.minimumPurchase) {
      throw new BadRequestException(
        `Minimum purchase of $${discount.minimumPurchase} required`
      );
    }

    return discount;
  }

  /**
   * Increment usage count when a discount is applied
   */
  async incrementUsage(id: string) {
    return this.prisma.discountCode.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }
}
