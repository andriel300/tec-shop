import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { CreateCategoryDto, UpdateCategoryDto } from '@tec-shop/dto';
import { SellerPrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: SellerPrismaService) {}

  /**
   * Create a new category
   */
  async create(createCategoryDto: CreateCategoryDto) {
    // Generate slug if not provided
    const slug = createCategoryDto.slug || this.generateSlug(createCategoryDto.name);

    // Check if slug already exists
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug '${slug}' already exists`);
    }

    // If parentId is provided, verify it exists
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${createCategoryDto.parentId} not found`);
      }
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        slug,
        description: createCategoryDto.description,
        parentId: createCategoryDto.parentId,
        attributes: createCategoryDto.attributes || undefined,
        image: createCategoryDto.image,
        position: createCategoryDto.position || 0,
        isActive: createCategoryDto.isActive ?? true,
      },
    });
  }

  /**
   * Get all categories (with optional hierarchical structure)
   */
  async findAll(options?: {
    includeChildren?: boolean;
    onlyActive?: boolean;
    parentId?: string | null;
  }) {
    const { includeChildren = true, onlyActive = false, parentId } = options || {};

    // If we want hierarchical structure
    if (includeChildren) {
      // Get root categories (no parent) or specific parent's children
      const categories = await this.prisma.category.findMany({
        where: {
          ...(parentId === null ? { parentId: null } : parentId ? { parentId } : {}),
          ...(onlyActive && { isActive: true }),
        },
        include: {
          children: {
            where: onlyActive ? { isActive: true } : undefined,
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      });

      return categories;
    }

    // Flat list of all categories
    return this.prisma.category.findMany({
      where: {
        ...(onlyActive && { isActive: true }),
      },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Get category by ID
   */
  async findOne(id: string, includeChildren = true, includeProducts = false) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: includeChildren ? {
          orderBy: { position: 'asc' },
        } : false,
        parent: true,
        products: includeProducts ? {
          where: { isActive: true },
          take: 10,
        } : false,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async findBySlug(slug: string, includeChildren = true) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: includeChildren ? {
          orderBy: { position: 'asc' },
        } : false,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  /**
   * Update category
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Verify category exists
    await this.findOne(id, false);

    const updateData: Record<string, unknown> = {};

    // Update slug if name changed
    if (updateCategoryDto.name) {
      updateData.name = updateCategoryDto.name;
      if (!updateCategoryDto.slug) {
        updateData.slug = this.generateSlug(updateCategoryDto.name);
      }
    }

    if (updateCategoryDto.slug) {
      // Check if new slug already exists (excluding current category)
      const existing = await this.prisma.category.findFirst({
        where: {
          slug: updateCategoryDto.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Category with slug '${updateCategoryDto.slug}' already exists`);
      }
      updateData.slug = updateCategoryDto.slug;
    }

    if (updateCategoryDto.description !== undefined) {
      updateData.description = updateCategoryDto.description;
    }

    if (updateCategoryDto.parentId !== undefined) {
      // Prevent circular references
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }

      if (updateCategoryDto.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: updateCategoryDto.parentId },
        });

        if (!parent) {
          throw new NotFoundException(`Parent category with ID ${updateCategoryDto.parentId} not found`);
        }
      }

      updateData.parentId = updateCategoryDto.parentId;
    }

    if (updateCategoryDto.attributes !== undefined) {
      updateData.attributes = updateCategoryDto.attributes;
    }

    if (updateCategoryDto.image !== undefined) {
      updateData.image = updateCategoryDto.image;
    }

    if (updateCategoryDto.position !== undefined) {
      updateData.position = updateCategoryDto.position;
    }

    if (updateCategoryDto.isActive !== undefined) {
      updateData.isActive = updateCategoryDto.isActive;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete category
   */
  async remove(id: string) {
    // Verify category exists
    const category = await this.findOne(id, true);

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new ConflictException('Cannot delete category with subcategories. Delete or reassign children first.');
    }

    // Check if category has products
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException(`Cannot delete category with ${productsCount} products. Reassign products first.`);
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Get category tree (full hierarchical structure)
   */
  async getCategoryTree(onlyActive = false) {
    // Get all root categories
    const rootCategories = await this.prisma.category.findMany({
      where: {
        parentId: null,
        ...(onlyActive && { isActive: true }),
      },
      include: {
        children: {
          where: onlyActive ? { isActive: true } : undefined,
          include: {
            children: {
              where: onlyActive ? { isActive: true } : undefined,
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    return rootCategories;
  }

  /**
   * Generate URL-friendly slug from category name
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
