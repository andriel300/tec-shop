import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductVariantDto,
} from '@tec-shop/dto';
import { ProductPrismaService } from '../../prisma/prisma.service';
import {
  ProductType,
  ProductStatus,
  ProductVisibility,
} from '@tec-shop/product-client';
import { SellerServiceClient } from '../../clients/seller.client';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: ProductPrismaService,
    private readonly sellerClient: SellerServiceClient
  ) {}

  async create(
    sellerId: string,
    createProductDto: CreateProductDto & { shopId: string },
    imagePaths: string[]
  ) {
    try {
      this.logger.log(`Starting product creation for seller: ${sellerId}`);

      // Extract shopId from productData (added by API Gateway)
      const { shopId } = createProductDto;

      if (!shopId) {
        this.logger.error('Product creation failed: No shopId provided');
        throw new BadRequestException('Shop ID is required');
      }

      this.logger.debug(`Verifying shop ownership - shopId: ${shopId}`);

      // Verify shop exists and seller owns it
      const [shopExists, ownsShop] = await Promise.all([
        this.sellerClient.verifyShopExists(shopId),
        this.sellerClient.verifyShopOwnership(sellerId, shopId),
      ]);

      this.logger.debug(
        `Shop verification result - exists: ${shopExists}, owns: ${ownsShop}`
      );

      if (!shopExists) {
        this.logger.error(`Shop not found: ${shopId}`);
        throw new NotFoundException('Shop not found');
      }

      if (!ownsShop) {
        this.logger.error(
          `Seller ${sellerId} does not own shop ${shopId}`
        );
        throw new ForbiddenException('You do not have access to this shop');
      }

      // Verify category exists
      this.logger.debug(
        `Verifying category exists - categoryId: ${createProductDto.categoryId}`
      );
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        this.logger.error(
          `Category not found: ${createProductDto.categoryId}`
        );
        throw new NotFoundException(
          `Category with ID ${createProductDto.categoryId} not found`
        );
      }

      // Verify brand if provided
      if (createProductDto.brandId) {
        this.logger.debug(
          `Verifying brand exists - brandId: ${createProductDto.brandId}`
        );
        const brand = await this.prisma.brand.findUnique({
          where: { id: createProductDto.brandId },
        });

        if (!brand) {
          this.logger.error(`Brand not found: ${createProductDto.brandId}`);
          throw new NotFoundException(
            `Brand with ID ${createProductDto.brandId} not found`
          );
        }
      }

      // Sanitize data types FIRST (multipart/form-data sends everything as strings)
      this.logger.debug(`Sanitizing product data - price: ${createProductDto.price} (${typeof createProductDto.price}), stock: ${createProductDto.stock} (${typeof createProductDto.stock})`);
      const sanitizedData = this.sanitizeProductData(createProductDto);

      // Generate slug from SEO slug or product name
      this.logger.debug(`Generating slug for product: ${sanitizedData.name}`);
      const slug =
        sanitizedData.seo?.slug || this.generateSlug(sanitizedData.name);

      // Check if slug already exists
      this.logger.debug(`Checking if slug already exists: ${slug}`);
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        this.logger.error(`Product with slug '${slug}' already exists`);
        throw new BadRequestException(
          `Product with slug '${slug}' already exists`
        );
      }

      // Validate variants for variable products
      if (sanitizedData.productType === 'variable') {
        this.logger.debug('Validating variants for variable product');
        if (
          !Array.isArray(sanitizedData.variants) ||
          sanitizedData.variants.length === 0
        ) {
          this.logger.error('Variable product has no variants');
          throw new BadRequestException(
            'Variable products must have at least one variant'
          );
        }

        // Validate unique SKUs
        const skus = sanitizedData.variants.map((v) => v.sku);
        const duplicates = skus.filter(
          (sku, index) => skus.indexOf(sku) !== index
        );
        if (duplicates.length > 0) {
          this.logger.error(`Duplicate SKUs found: ${duplicates.join(', ')}`);
          throw new BadRequestException(
            `Duplicate SKUs found: ${duplicates.join(', ')}`
          );
        }

        // Check if SKUs already exist
        const existingSkus = await this.prisma.productVariant.findMany({
          where: { sku: { in: skus } },
        });

        if (existingSkus.length > 0) {
          this.logger.error(
            `SKUs already exist: ${existingSkus.map((v) => v.sku).join(', ')}`
          );
          throw new BadRequestException(
            `SKUs already exist: ${existingSkus.map((v) => v.sku).join(', ')}`
          );
        }
      }

      // Create product with variants in a transaction
      this.logger.log('Creating product in database transaction');

      const product = await this.prisma.$transaction(async (tx) => {
        // Create the product
        this.logger.debug('Creating product record');
        const newProduct = await tx.product.create({
          data: {
            shopId,
            name: sanitizedData.name,
            description: sanitizedData.description,
            categoryId: sanitizedData.categoryId,
            brandId: sanitizedData.brandId,
            productType: this.mapProductType(sanitizedData.productType),
            price: sanitizedData.price,
            salePrice: sanitizedData.salePrice,
            stock: sanitizedData.stock,
            images: imagePaths,
            hasVariants: sanitizedData.hasVariants,
            attributes: sanitizedData.attributes,
            shipping: sanitizedData.shipping,
            seo: sanitizedData.seo,
            inventory: sanitizedData.inventory,
            warranty: sanitizedData.warranty,
            tags: sanitizedData.tags,
            slug,
            status: this.mapProductStatus(sanitizedData.status),
            visibility: this.mapProductVisibility(sanitizedData.visibility),
            publishDate: sanitizedData.publishDate,
            isFeatured: sanitizedData.isFeatured,
            isActive: sanitizedData.isActive,
            deletedAt: null, // Explicitly set to null for soft-delete support
          },
        });

        this.logger.debug(`Product record created - ID: ${newProduct.id}`);

        // Create variants if it's a variable product
        if (
          sanitizedData.hasVariants &&
          Array.isArray(sanitizedData.variants) &&
          sanitizedData.variants.length > 0
        ) {
          this.logger.debug(
            `Creating ${sanitizedData.variants.length} product variants`
          );
          await tx.productVariant.createMany({
            data: sanitizedData.variants.map((variant: ProductVariantDto) => ({
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
          this.logger.debug('Product variants created successfully');
        }

        return newProduct;
      });

      this.logger.log(`Product created successfully - ID: ${product.id}`);

      // Fetch the complete product with variants
      this.logger.debug('Fetching complete product with relations');
      return this.findOne(product.id, sellerId);
    } catch (error) {
      this.logger.error(
        `Product creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async findAll(
    shopId: string,
    filters?: {
      categoryId?: string;
      brandId?: string;
      productType?: string;
      status?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      search?: string;
    }
  ) {
    this.logger.debug(
      `findAll called with shopId: ${shopId}, filters: ${JSON.stringify(filters)}`
    );

    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        // Only show non-deleted products
        deletedAt: null,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.brandId && { brandId: filters.brandId }),
        ...(filters?.productType && {
          productType: this.mapProductType(
            filters.productType as 'simple' | 'variable' | 'digital'
          ),
        }),
        ...(filters?.status && {
          status: this.mapProductStatus(
            filters.status as 'draft' | 'published' | 'scheduled'
          ),
        }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.isFeatured !== undefined && {
          isFeatured: filters.isFeatured,
        }),
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

    this.logger.debug(`findAll returning ${products.length} products`);

    return products;
  }

  async findOne(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
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

    // Verify ownership via seller-service
    const ownsShop = await this.sellerClient.verifyShopOwnership(
      sellerId,
      product.shopId
    );
    if (!ownsShop) {
      throw new ForbiddenException('You do not have access to this product');
    }

    return product;
  }

  async update(
    id: string,
    sellerId: string,
    updateProductDto: UpdateProductDto,
    newImagePaths?: string[]
  ) {
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

    if (updateProductDto.description !== undefined)
      updateData.description = updateProductDto.description;
    if (updateProductDto.categoryId !== undefined) {
      // Verify category exists
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateProductDto.categoryId} not found`
        );
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
          throw new NotFoundException(
            `Brand with ID ${updateProductDto.brandId} not found`
          );
        }
      }
      updateData.brandId = updateProductDto.brandId;
    }

    if (updateProductDto.productType !== undefined)
      updateData.productType = this.mapProductType(
        updateProductDto.productType
      );
    if (updateProductDto.price !== undefined)
      updateData.price = updateProductDto.price;
    if (updateProductDto.salePrice !== undefined)
      updateData.salePrice = updateProductDto.salePrice;
    if (updateProductDto.stock !== undefined)
      updateData.stock = updateProductDto.stock;
    if (updateProductDto.hasVariants !== undefined)
      updateData.hasVariants = updateProductDto.hasVariants;
    if (updateProductDto.attributes !== undefined)
      updateData.attributes = updateProductDto.attributes;
    if (updateProductDto.shipping !== undefined)
      updateData.shipping = updateProductDto.shipping;
    if (updateProductDto.seo !== undefined) {
      updateData.seo = updateProductDto.seo;
      if (updateProductDto.seo.slug) {
        updateData.slug = updateProductDto.seo.slug;
      }
    }
    if (updateProductDto.inventory !== undefined)
      updateData.inventory = updateProductDto.inventory;
    if (updateProductDto.warranty !== undefined)
      updateData.warranty = updateProductDto.warranty;
    if (updateProductDto.tags !== undefined)
      updateData.tags = updateProductDto.tags;
    if (updateProductDto.status !== undefined)
      updateData.status = this.mapProductStatus(updateProductDto.status);
    if (updateProductDto.visibility !== undefined)
      updateData.visibility = this.mapProductVisibility(
        updateProductDto.visibility
      );
    if (updateProductDto.publishDate !== undefined)
      updateData.publishDate = updateProductDto.publishDate;
    if (updateProductDto.isFeatured !== undefined)
      updateData.isFeatured = updateProductDto.isFeatured;
    if (updateProductDto.isActive !== undefined)
      updateData.isActive = updateProductDto.isActive;

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
            data: updateProductDto.variants.map(
              (variant: ProductVariantDto) => ({
                productId: id,
                sku: variant.sku,
                attributes: variant.attributes,
                price: variant.price,
                salePrice: variant.salePrice,
                stock: variant.stock,
                image: variant.image,
                isActive: variant.isActive ?? true,
              })
            ),
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

    // Soft delete product (set deletedAt timestamp)
    // Product will be permanently deleted after 24 hours by scheduled task
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
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
   * Sanitize product data types from multipart/form-data
   * Form data sends everything as strings, need to convert to proper types
   */
  private sanitizeProductData(dto: Record<string, unknown>) {
    // Helper to parse JSON strings safely
    const parseJSON = (value: unknown) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    };

    // Helper to convert to number
    const toNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? undefined : num;
    };

    // Helper to convert to boolean
    const toBoolean = (value: unknown): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    return {
      ...dto,
      // Numbers
      price: toNumber(dto.price),
      salePrice: toNumber(dto.salePrice),
      stock: toNumber(dto.stock) || 0,

      // Booleans
      hasVariants: toBoolean(dto.hasVariants),
      isFeatured: toBoolean(dto.isFeatured),
      isActive: dto.isActive !== undefined ? toBoolean(dto.isActive) : true,

      // JSON objects
      attributes: parseJSON(dto.attributes) || undefined,
      shipping: parseJSON(dto.shipping) || undefined,
      seo: parseJSON(dto.seo) || undefined,
      inventory: parseJSON(dto.inventory) || undefined,

      // Arrays
      tags: parseJSON(dto.tags) || [],
      variants: parseJSON(dto.variants) || [],
    };
  }

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
  private mapProductType(
    type?: 'simple' | 'variable' | 'digital'
  ): ProductType {
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
  private mapProductStatus(
    status?: 'draft' | 'published' | 'scheduled'
  ): ProductStatus {
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
  private mapProductVisibility(
    visibility?: 'public' | 'private' | 'password_protected'
  ): ProductVisibility {
    if (!visibility) return ProductVisibility.PUBLIC;

    const mapping: Record<string, ProductVisibility> = {
      public: ProductVisibility.PUBLIC,
      private: ProductVisibility.PRIVATE,
      password_protected: ProductVisibility.PASSWORD_PROTECTED,
    };

    return mapping[visibility] || ProductVisibility.PUBLIC;
  }
}
