import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { CreateBrandDto, UpdateBrandDto } from '@tec-shop/dto';
import { ProductPrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: ProductPrismaService) {}

  /**
   * Create a new brand
   */
  async create(createBrandDto: CreateBrandDto) {
    // Generate slug if not provided
    const slug = createBrandDto.slug || this.generateSlug(createBrandDto.name);

    // Check if slug or name already exists
    const existing = await this.prisma.brand.findFirst({
      where: {
        OR: [
          { slug },
          { name: createBrandDto.name },
        ],
      },
    });

    if (existing) {
      if (existing.name === createBrandDto.name) {
        throw new ConflictException(`Brand with name '${createBrandDto.name}' already exists`);
      }
      throw new ConflictException(`Brand with slug '${slug}' already exists`);
    }

    return this.prisma.brand.create({
      data: {
        name: createBrandDto.name,
        slug,
        description: createBrandDto.description,
        logo: createBrandDto.logo,
        website: createBrandDto.website,
        isActive: createBrandDto.isActive ?? true,
      },
    });
  }

  /**
   * Get all brands
   */
  async findAll(options?: {
    onlyActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const { onlyActive = false, search, limit, offset } = options || {};

    const where = {
      ...(onlyActive && { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        ...(limit && { take: limit }),
        ...(offset && { skip: offset }),
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      brands,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get brand by ID
   */
  async findOne(id: string, includeProducts = false) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: includeProducts ? {
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        } : false,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  /**
   * Get brand by slug
   */
  async findBySlug(slug: string, includeProducts = false) {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      include: {
        products: includeProducts ? {
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        } : false,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with slug '${slug}' not found`);
    }

    return brand;
  }

  /**
   * Update brand
   */
  async update(id: string, updateBrandDto: UpdateBrandDto) {
    // Verify brand exists
    await this.findOne(id);

    const updateData: Record<string, unknown> = {};

    // Update slug if name changed
    if (updateBrandDto.name) {
      // Check if new name already exists (excluding current brand)
      const existing = await this.prisma.brand.findFirst({
        where: {
          name: updateBrandDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Brand with name '${updateBrandDto.name}' already exists`);
      }

      updateData.name = updateBrandDto.name;

      if (!updateBrandDto.slug) {
        updateData.slug = this.generateSlug(updateBrandDto.name);
      }
    }

    if (updateBrandDto.slug) {
      // Check if new slug already exists (excluding current brand)
      const existing = await this.prisma.brand.findFirst({
        where: {
          slug: updateBrandDto.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Brand with slug '${updateBrandDto.slug}' already exists`);
      }

      updateData.slug = updateBrandDto.slug;
    }

    if (updateBrandDto.description !== undefined) {
      updateData.description = updateBrandDto.description;
    }

    if (updateBrandDto.logo !== undefined) {
      updateData.logo = updateBrandDto.logo;
    }

    if (updateBrandDto.website !== undefined) {
      updateData.website = updateBrandDto.website;
    }

    if (updateBrandDto.isActive !== undefined) {
      updateData.isActive = updateBrandDto.isActive;
    }

    return this.prisma.brand.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete brand
   */
  async remove(id: string) {
    // Verify brand exists
    await this.findOne(id);

    // Check if brand has products
    const productsCount = await this.prisma.product.count({
      where: { brandId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        `Cannot delete brand with ${productsCount} products. Reassign or delete products first.`
      );
    }

    return this.prisma.brand.delete({
      where: { id },
    });
  }

  /**
   * Get popular brands (by product count)
   */
  async getPopularBrands(limit = 10) {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return brands;
  }

  /**
   * Generate URL-friendly slug from brand name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }
}
