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
    // Validate seller exists
    const seller = await this.prisma.seller.findUnique({
      where: { id: dto.sellerId },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check if code already exists
    const existingCode = await this.prisma.discountCode.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new BadRequestException('Discount code already exists');
    }

    // Validate discount value
    if (dto.discountType === 'PERCENTAGE' && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
    if (dto.discountValue <= 0) {
      throw new BadRequestException('Discount value must be greater than 0');
    }

    return this.prisma.discountCode.create({
      data: dto,
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
   * Get all discount codes for a specific seller
   */
  async findAll(sellerId: string) {
    return this.prisma.discountCode.findMany({
      where: { sellerId },
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
  async findOne(id: string, sellerId: string) {
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

    // Security: Verify ownership
    if (discount.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this discount code');
    }

    return discount;
  }

  /**
   * Update a discount code (with ownership check)
   */
  async update(id: string, dto: UpdateDiscountDto, sellerId: string) {
    // Check ownership first
    const existing = await this.findOne(id, sellerId);

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

    return this.prisma.discountCode.update({
      where: { id },
      data: dto,
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
  async remove(id: string, sellerId: string) {
    // Check ownership first
    await this.findOne(id, sellerId);

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
