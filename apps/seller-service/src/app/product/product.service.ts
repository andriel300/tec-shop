import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { CreateProductDto, UpdateProductDto } from '@tec-shop/dto';
import { SellerPrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: SellerPrismaService) {}

  async create(sellerId: string, createProductDto: CreateProductDto, imagePaths: string[]) {
    // Verify seller has a shop
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller?.shop) {
      throw new ForbiddenException('You must create a shop before adding products');
    }

    // Generate slug from product name
    const slug = this.generateSlug(createProductDto.name);

    // Create product
    const product = await this.prisma.product.create({
      data: {
        shopId: seller.shop.id,
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        category: createProductDto.category,
        images: imagePaths,
        slug,
        tags: createProductDto.tags || [],
        isFeatured: createProductDto.isFeatured || false,
      },
    });

    return product;
  }

  async findAll(shopId: string, filters?: {
    category?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  }) {
    return this.prisma.product.findMany({
      where: {
        shopId,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: { include: { seller: true } } },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify ownership
    if (product.shop.seller.id !== sellerId) {
      throw new ForbiddenException('You do not have access to this product');
    }

    return product;
  }

  async update(id: string, sellerId: string, updateProductDto: UpdateProductDto, newImagePaths?: string[]) {
    // Verify ownership first
    await this.findOne(id, sellerId);

    const updateData: Record<string, unknown> = { ...updateProductDto };

    // If new images provided, replace old ones
    if (newImagePaths && newImagePaths.length > 0) {
      updateData.images = newImagePaths;
    }

    // Update slug if name changed
    if (updateProductDto.name) {
      updateData.slug = this.generateSlug(updateProductDto.name);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, sellerId: string) {
    // Verify ownership first
    await this.findOne(id, sellerId);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async incrementViews(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  // Helper method to generate URL-friendly slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .concat(`-${Date.now()}`); // Add timestamp for uniqueness
  }
}
