import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { CreateProductDto, UpdateProductDto, ProductVariantDto } from '@tec-shop/dto';
import { SellerPrismaService } from '../../prisma/prisma.service';
import { ProductType, ProductStatus, ProductVisibility } from '@prisma/seller-client';

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

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found`);
    }

    // Verify brand if provided
    if (createProductDto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: createProductDto.brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand with ID ${createProductDto.brandId} not found`);
      }
    }

    // Generate slug from SEO slug or product name
    const slug = createProductDto.seo?.slug || this.generateSlug(createProductDto.name);

    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new BadRequestException(`Product with slug '${slug}' already exists`);
    }

    // Validate variants for variable products
    if (createProductDto.productType === 'variable') {
      if (!createProductDto.variants || createProductDto.variants.length === 0) {
        throw new BadRequestException('Variable products must have at least one variant');
      }

      // Validate unique SKUs
      const skus = createProductDto.variants.map(v => v.sku);
      const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
      if (duplicates.length > 0) {
        throw new BadRequestException(`Duplicate SKUs found: ${duplicates.join(', ')}`);
      }

      // Check if SKUs already exist
      const existingSkus = await this.prisma.productVariant.findMany({
        where: { sku: { in: skus } },
      });

      if (existingSkus.length > 0) {
        throw new BadRequestException(`SKUs already exist: ${existingSkus.map(v => v.sku).join(', ')}`);
      }
    }

    // Create product with variants in a transaction
    const product = await this.prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          shopId: seller.shop.id,
          name: createProductDto.name,
          description: createProductDto.description,
          categoryId: createProductDto.categoryId,
          brandId: createProductDto.brandId,
          productType: this.mapProductType(createProductDto.productType),
          price: createProductDto.price,
          salePrice: createProductDto.salePrice,
          stock: createProductDto.stock,
          images: imagePaths,
          hasVariants: createProductDto.hasVariants || false,
          attributes: createProductDto.attributes || undefined,
          shipping: createProductDto.shipping || undefined,
          seo: createProductDto.seo || undefined,
          inventory: createProductDto.inventory || undefined,
          warranty: createProductDto.warranty,
          tags: createProductDto.tags || [],
          slug,
          status: this.mapProductStatus(createProductDto.status),
          visibility: this.mapProductVisibility(createProductDto.visibility),
          publishDate: createProductDto.publishDate,
          isFeatured: createProductDto.isFeatured || false,
          isActive: createProductDto.isActive ?? true,
        },
      });

      // Create variants if it's a variable product
      if (createProductDto.hasVariants && createProductDto.variants && createProductDto.variants.length > 0) {
        await tx.productVariant.createMany({
          data: createProductDto.variants.map((variant: ProductVariantDto) => ({
            productId: newProduct.id,
            sku: variant.sku,
            attributes: variant.attributes,
            price: variant.price,
            salePrice: variant.salePrice,
            stock: variant.stock,
            image: variant.image,
            isActive: variant.isActive ?? true,
          })),
        });
      }

      return newProduct;
    });

    // Fetch the complete product with variants
    return this.findOne(product.id, sellerId);
  }

  async findAll(shopId: string, filters?: {
    categoryId?: string;
    brandId?: string;
    productType?: string;
    status?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
  }) {
    return this.prisma.product.findMany({
      where: {
        shopId,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.brandId && { brandId: filters.brandId }),
        ...(filters?.productType && { productType: this.mapProductType(filters.productType as 'simple' | 'variable' | 'digital') }),
        ...(filters?.status && { status: this.mapProductStatus(filters.status as 'draft' | 'published' | 'scheduled') }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        category: true,
        brand: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: { include: { seller: true } },
        category: true,
        brand: true,
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
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
    // Verify ownership first (throws if not owner)
    await this.findOne(id, sellerId);

    const updateData: Record<string, unknown> = {};

    // Map all updatable fields
    if (updateProductDto.name !== undefined) {
      updateData.name = updateProductDto.name;
      // Update slug if name changed and no custom SEO slug
      if (!updateProductDto.seo?.slug) {
        updateData.slug = this.generateSlug(updateProductDto.name);
      }
    }

    if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;
    if (updateProductDto.categoryId !== undefined) {
      // Verify category exists
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateProductDto.categoryId} not found`);
      }
      updateData.categoryId = updateProductDto.categoryId;
    }

    if (updateProductDto.brandId !== undefined) {
      if (updateProductDto.brandId) {
        // Verify brand exists
        const brand = await this.prisma.brand.findUnique({
          where: { id: updateProductDto.brandId },
        });
        if (!brand) {
          throw new NotFoundException(`Brand with ID ${updateProductDto.brandId} not found`);
        }
      }
      updateData.brandId = updateProductDto.brandId;
    }

    if (updateProductDto.productType !== undefined) updateData.productType = this.mapProductType(updateProductDto.productType);
    if (updateProductDto.price !== undefined) updateData.price = updateProductDto.price;
    if (updateProductDto.salePrice !== undefined) updateData.salePrice = updateProductDto.salePrice;
    if (updateProductDto.stock !== undefined) updateData.stock = updateProductDto.stock;
    if (updateProductDto.hasVariants !== undefined) updateData.hasVariants = updateProductDto.hasVariants;
    if (updateProductDto.attributes !== undefined) updateData.attributes = updateProductDto.attributes;
    if (updateProductDto.shipping !== undefined) updateData.shipping = updateProductDto.shipping;
    if (updateProductDto.seo !== undefined) {
      updateData.seo = updateProductDto.seo;
      if (updateProductDto.seo.slug) {
        updateData.slug = updateProductDto.seo.slug;
      }
    }
    if (updateProductDto.inventory !== undefined) updateData.inventory = updateProductDto.inventory;
    if (updateProductDto.warranty !== undefined) updateData.warranty = updateProductDto.warranty;
    if (updateProductDto.tags !== undefined) updateData.tags = updateProductDto.tags;
    if (updateProductDto.status !== undefined) updateData.status = this.mapProductStatus(updateProductDto.status);
    if (updateProductDto.visibility !== undefined) updateData.visibility = this.mapProductVisibility(updateProductDto.visibility);
    if (updateProductDto.publishDate !== undefined) updateData.publishDate = updateProductDto.publishDate;
    if (updateProductDto.isFeatured !== undefined) updateData.isFeatured = updateProductDto.isFeatured;
    if (updateProductDto.isActive !== undefined) updateData.isActive = updateProductDto.isActive;

    // If new images provided, replace old ones
    if (newImagePaths && newImagePaths.length > 0) {
      updateData.images = newImagePaths;
    }

    // Handle variants update in transaction
    if (updateProductDto.variants !== undefined) {
      return this.prisma.$transaction(async (tx) => {
        // Update product
        const updatedProduct = await tx.product.update({
          where: { id },
          data: updateData,
        });

        // Delete existing variants
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        // Create new variants
        if (updateProductDto.variants && updateProductDto.variants.length > 0) {
          await tx.productVariant.createMany({
            data: updateProductDto.variants.map((variant: ProductVariantDto) => ({
              productId: id,
              sku: variant.sku,
              attributes: variant.attributes,
              price: variant.price,
              salePrice: variant.salePrice,
              stock: variant.stock,
              image: variant.image,
              isActive: variant.isActive ?? true,
            })),
          });
        }

        return updatedProduct;
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, sellerId: string) {
    // Verify ownership first
    await this.findOne(id, sellerId);

    // Delete product (variants will be cascade deleted)
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

  async incrementSales(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { sales: { increment: 1 } },
    });
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Generate URL-friendly slug from product name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .concat(`-${Date.now()}`); // Add timestamp for uniqueness
  }

  /**
   * Map product type from DTO to Prisma enum
   */
  private mapProductType(type?: 'simple' | 'variable' | 'digital'): ProductType {
    if (!type) return ProductType.SIMPLE;

    const mapping: Record<string, ProductType> = {
      simple: ProductType.SIMPLE,
      variable: ProductType.VARIABLE,
      digital: ProductType.DIGITAL,
    };

    return mapping[type] || ProductType.SIMPLE;
  }

  /**
   * Map product status from DTO to Prisma enum
   */
  private mapProductStatus(status?: 'draft' | 'published' | 'scheduled'): ProductStatus {
    if (!status) return ProductStatus.DRAFT;

    const mapping: Record<string, ProductStatus> = {
      draft: ProductStatus.DRAFT,
      published: ProductStatus.PUBLISHED,
      scheduled: ProductStatus.SCHEDULED,
    };

    return mapping[status] || ProductStatus.DRAFT;
  }

  /**
   * Map product visibility from DTO to Prisma enum
   */
  private mapProductVisibility(visibility?: 'public' | 'private' | 'password_protected'): ProductVisibility {
    if (!visibility) return ProductVisibility.PUBLIC;

    const mapping: Record<string, ProductVisibility> = {
      public: ProductVisibility.PUBLIC,
      private: ProductVisibility.PRIVATE,
      password_protected: ProductVisibility.PASSWORD_PROTECTED,
    };

    return mapping[visibility] || ProductVisibility.PUBLIC;
  }
}
