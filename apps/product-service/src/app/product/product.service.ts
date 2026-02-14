import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductVariantDto,
  CreateRatingDto,
  UpdateRatingDto,
} from '@tec-shop/dto';
import { ProductPrismaService } from '../../prisma/prisma.service';
import {
  ProductType,
  ProductStatus,
  ProductVisibility,
} from '@tec-shop/product-client';
import { SellerServiceClient } from '../../clients/seller.client';
import { LogProducerService } from '@tec-shop/logger-producer';
import { NotificationProducerService } from '@tec-shop/notification-producer';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: ProductPrismaService,
    private readonly sellerClient: SellerServiceClient,
    private readonly logProducer: LogProducerService,
    private readonly notificationProducer: NotificationProducerService,
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
        this.logProducer.warn('product-service', 'product', 'Product creation failed - shop not found', {
          sellerId,
          metadata: { action: 'create_product', shopId },
        });
        throw new NotFoundException('Shop not found');
      }

      if (!ownsShop) {
        this.logger.error(
          `Seller ${sellerId} does not own shop ${shopId}`
        );
        this.logProducer.warn('product-service', 'product', 'Product creation failed - shop ownership verification failed', {
          sellerId,
          metadata: { action: 'create_product', shopId },
        });
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
      const sanitizedData = this.sanitizeProductData(createProductDto) as CreateProductDto & {
        price: number | undefined;
        salePrice: number | undefined;
        stock: number;
        hasVariants: boolean;
        isFeatured: boolean;
        isActive: boolean;
      };

      // Validate required numeric fields
      if (!sanitizedData.price || sanitizedData.price <= 0) {
        this.logger.error('Invalid price value');
        throw new BadRequestException('Product price is required and must be greater than 0');
      }

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
        const skus = sanitizedData.variants.map((v: { sku: string }) => v.sku);
        const duplicates = skus.filter(
          (sku: string, index: number) => skus.indexOf(sku) !== index
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

      // Automatically set hasVariants based on variants array
      const hasVariants =
        sanitizedData.variants && sanitizedData.variants.length > 0;

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
            hasVariants,
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
        if (hasVariants && Array.isArray(sanitizedData.variants)) {
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
      this.logProducer.info('product-service', 'product', 'Product created', {
        sellerId,
        metadata: { action: 'create_product', productId: product.id, shopId },
      });

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

  async findDeleted(
    shopId: string,
    filters?: {
      categoryId?: string;
      brandId?: string;
      search?: string;
    }
  ) {
    this.logger.debug(
      `findDeleted called with shopId: ${shopId}, filters: ${JSON.stringify(filters)}`
    );

    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        // Only show deleted products (deletedAt is not null)
        deletedAt: { not: null },
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.brandId && { brandId: filters.brandId }),
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
      orderBy: { deletedAt: 'desc' }, // Most recently deleted first
    });

    this.logger.debug(`findDeleted returning ${products.length} deleted products`);

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
      // Automatically set hasVariants based on variants array
      updateData.hasVariants = updateProductDto.variants.length > 0;

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

        this.logProducer.info('product-service', 'product', 'Product updated with variants', {
          sellerId,
          metadata: { action: 'update_product', productId: id },
        });

        return updatedProduct;
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    this.logProducer.info('product-service', 'product', 'Product updated', {
      sellerId,
      metadata: { action: 'update_product', productId: id },
    });

    return updated;
  }

  async remove(id: string, sellerId: string) {
    // Verify ownership first
    await this.findOne(id, sellerId);

    // Soft delete product (set deletedAt timestamp)
    // Product will be permanently deleted after 24 hours by scheduled task
    const result = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logProducer.info('product-service', 'product', 'Product soft-deleted', {
      sellerId,
      metadata: { action: 'delete_product', productId: id },
    });

    return result;
  }

  async restore(id: string, sellerId: string) {
    // Find the product (including deleted ones)
    const product = await this.prisma.product.findUnique({
      where: { id },
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

    // Check if product is actually deleted
    if (!product.deletedAt) {
      throw new BadRequestException('Product is not deleted');
    }

    // Restore product by setting deletedAt to null
    this.logger.log(`Restoring product ${id} for seller ${sellerId}`);
    const restored = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        category: true,
        brand: true,
        variants: true,
      },
    });

    this.logProducer.info('product-service', 'product', 'Product restored', {
      sellerId,
      metadata: { action: 'restore_product', productId: id },
    });

    return restored;
  }

  /**
   * Find multiple products by their IDs (for recommendation enrichment).
   * Returns only active, non-deleted products with fields needed by ProductCard.
   */
  async findByIds(ids: string[]) {
    return this.prisma.product.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
      },
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

  /**
   * Find public products for marketplace frontend
   * Returns only published, public, active, non-deleted products
   * Supports comprehensive filtering, sorting, and pagination
   */
  async findPublicProducts(filters: {
    categoryId?: string;
    brandId?: string;
    shopId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    productType?: string;
    isFeatured?: boolean;
    onSale?: boolean;
    tags?: string[];
    colors?: string[];
    sizes?: string[];
    sort?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      categoryId,
      brandId,
      shopId,
      search,
      minPrice,
      maxPrice,
      productType,
      isFeatured,
      onSale,
      tags,
      colors,
      sizes,
      sort = 'newest',
      limit = 20,
      offset = 0,
    } = filters;

    this.logger.debug(
      `findPublicProducts called with filters: ${JSON.stringify({
        categoryId,
        brandId,
        shopId,
        search,
        minPrice,
        maxPrice,
        productType,
        isFeatured,
        onSale,
        tags,
        colors,
        sizes,
        sort,
        limit,
        offset,
      })}`
    );

    // Build where clause with public visibility rules
    const where: Record<string, unknown> = {
      // Public visibility rules (only return products visible to public)
      status: ProductStatus.PUBLISHED,
      visibility: ProductVisibility.PUBLIC,
      isActive: true,
      deletedAt: null,

      // Filters
      ...(categoryId && {
        categoryId: categoryId.includes(',')
          ? { in: categoryId.split(',').map((id) => id.trim()) }
          : categoryId,
      }),
      ...(brandId && { brandId }),
      ...(shopId && { shopId }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(productType && {
        productType: this.mapProductType(
          productType as 'simple' | 'variable' | 'digital'
        ),
      }),

      // Price range
      ...(minPrice !== undefined &&
        maxPrice !== undefined && {
          price: { gte: minPrice, lte: maxPrice },
        }),
      ...(minPrice !== undefined &&
        maxPrice === undefined && {
          price: { gte: minPrice },
        }),
      ...(minPrice === undefined &&
        maxPrice !== undefined && {
          price: { lte: maxPrice },
        }),

      // Tags filter (array contains any of the provided tags)
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),

      // Search (case-insensitive search in name, description, and tags)
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { tags: { hasSome: [search] } },
        ],
      }),
    };

    // Filter for products on sale (salePrice exists and is less than regular price)
    if (onSale === true) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          salePrice: { not: null },
        },
      ];
    }

    // Variant filtering for colors and sizes
    // Note: MongoDB has limited JSON query support in Prisma
    // We'll filter products with variants and then filter results in memory
    if ((colors && colors.length > 0) || (sizes && sizes.length > 0)) {
      // Only get products that have variants
      where.hasVariants = true;
    }

    // Sort mapping
    const orderByMap: Record<string, Record<string, string>> = {
      newest: { createdAt: 'desc' },
      'price-asc': { price: 'asc' },
      'price-desc': { price: 'desc' },
      popular: { views: 'desc' },
      'top-sales': { sales: 'desc' },
    };

    const orderBy = orderByMap[sort] || orderByMap.newest;

    this.logger.debug(`Query where clause: ${JSON.stringify(where)}`);
    this.logger.debug(`Query orderBy: ${JSON.stringify(orderBy)}`);

    const hasVariantFilters =
      (colors && colors.length > 0) || (sizes && sizes.length > 0);

    // If we have variant filters, we need to fetch all products and filter in-memory
    // Otherwise, use normal pagination
    let products;
    let total: number;

    if (hasVariantFilters) {
      // Fetch ALL matching products (without pagination) for accurate filtering
      const allProducts = await this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          variants: {
            where: { isActive: true },
          },
        },
        orderBy,
      });

      // Filter by variant attributes in-memory
      let filteredProducts = allProducts;

      if (colors && colors.length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
          return product.variants.some((variant) => {
            const attrs = variant.attributes as Record<string, unknown>;
            const colorValue =
              attrs.Color || attrs.color || attrs.COLOR || attrs.colour;
            if (typeof colorValue === 'string') {
              return colors.some(
                (c) => c.toLowerCase() === colorValue.toLowerCase()
              );
            }
            return false;
          });
        });
      }

      if (sizes && sizes.length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
          return product.variants.some((variant) => {
            const attrs = variant.attributes as Record<string, unknown>;
            const sizeValue = attrs.Size || attrs.size || attrs.SIZE;
            if (typeof sizeValue === 'string') {
              return sizes.some(
                (s) => s.toLowerCase() === sizeValue.toLowerCase()
              );
            }
            return false;
          });
        });
      }

      // Now paginate the filtered results
      total = filteredProducts.length;
      products = filteredProducts.slice(offset, offset + limit);
    } else {
      // No variant filters - use efficient database pagination
      const [fetchedProducts, count] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            category: true,
            brand: true,
            variants: {
              where: { isActive: true },
            },
          },
          orderBy,
          take: limit,
          skip: offset,
        }),
        this.prisma.product.count({ where }),
      ]);

      products = fetchedProducts;
      total = count;
    }

    this.logger.log(
      `findPublicProducts returning ${products.length} products out of ${total} total`
    );

    return {
      products,
      total,
      limit,
      offset,
      sort,
    };
  }

  /**
   * Get available filter options from actual product variants
   * Returns unique colors and sizes that exist in active product variants
   */
  async getAvailableFilters() {
    this.logger.debug('Getting available filter options from product variants');

    // Get all active variants from published, public, active products
    const variants = await this.prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: {
          status: ProductStatus.PUBLISHED,
          visibility: ProductVisibility.PUBLIC,
          isActive: true,
          deletedAt: null,
        },
      },
      select: {
        attributes: true,
      },
    });

    // Extract unique colors and sizes from variant attributes
    const colorsSet = new Set<string>();
    const sizesSet = new Set<string>();

    variants.forEach((variant) => {
      const attrs = variant.attributes as Record<string, unknown>;

      // Check for Color attribute (case-insensitive)
      Object.keys(attrs).forEach((key) => {
        const lowerKey = key.toLowerCase();
        const value = attrs[key];

        if (lowerKey === 'color' && typeof value === 'string') {
          colorsSet.add(value);
        } else if (lowerKey === 'size' && typeof value === 'string') {
          sizesSet.add(value);
        }
      });
    });

    const colors = Array.from(colorsSet).sort();
    const sizes = Array.from(sizesSet).sort();

    this.logger.log(
      `Found ${colors.length} unique colors and ${sizes.length} unique sizes`
    );

    return {
      colors,
      sizes,
    };
  }

  /**
   * Find a single public product by slug
   * Returns only published, public, active, non-deleted products
   */
  async findPublicProductBySlug(slug: string) {
    this.logger.debug(`findPublicProductBySlug called with slug: ${slug}`);

    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        // Public visibility rules (only return products visible to public)
        status: ProductStatus.PUBLISHED,
        visibility: ProductVisibility.PUBLIC,
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            attributes: true,
            price: true,
            salePrice: true,
            stock: true,
            image: true,
          },
        },
      },
    });

    if (!product) {
      this.logger.warn(`Product with slug ${slug} not found or not public`);
      throw new RpcException({
        statusCode: 404,
        message: 'Product not found',
      });
    }

    this.logger.log(`Returning product: ${product.id} (${product.name})`);

    return product;
  }

  // ============================================
  // Rating Methods
  // ============================================

  /**
   * Create or update a product rating
   * Users can only have one rating per product (enforced by unique constraint)
   * Recalculates product averageRating and ratingCount in a transaction
   */
  async createRating(
    productId: string,
    userId: string,
    createRatingDto: CreateRatingDto,
    reviewData?: {
      title?: string;
      content?: string;
      images?: string[];
      reviewerName?: string;
      reviewerAvatar?: string;
    }
  ) {
    this.logger.log(
      `Creating rating for product ${productId} by user ${userId} with ${createRatingDto.rating} stars`
    );

    // Verify product exists and is published
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      this.logger.error(`Product not found: ${productId}`);
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      this.logger.error(`Cannot rate unpublished product: ${productId}`);
      throw new BadRequestException('Cannot rate unpublished products');
    }

    // Use transaction to ensure consistency
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Try to create new rating, or update if exists (upsert)
        const rating = await tx.productRating.upsert({
          where: {
            productId_userId: {
              productId,
              userId,
            },
          },
          create: {
            productId,
            userId,
            rating: createRatingDto.rating,
            title: reviewData?.title,
            content: reviewData?.content,
            images: reviewData?.images ?? [],
            reviewerName: reviewData?.reviewerName,
            reviewerAvatar: reviewData?.reviewerAvatar,
          },
          update: {
            rating: createRatingDto.rating,
            title: reviewData?.title,
            content: reviewData?.content,
            images: reviewData?.images ?? [],
            reviewerName: reviewData?.reviewerName,
            reviewerAvatar: reviewData?.reviewerAvatar,
          },
        });

        // Recalculate product rating aggregates
        const aggregates = await tx.productRating.aggregate({
          where: { productId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        // Update product with new aggregates
        await tx.product.update({
          where: { id: productId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            ratingCount: aggregates._count.rating || 0,
          },
        });

        return rating;
      });

      this.logger.log(
        `Rating created/updated successfully - ratingId: ${result.id}`
      );
      this.logProducer.info('product-service', 'product', 'Product rating created', {
        userId,
        metadata: { action: 'create_rating', productId, rating: createRatingDto.rating },
      });

      // Send notification to seller when review has content
      if (reviewData?.content) {
        try {
          const shopInfo = await this.sellerClient.getShop(product.shopId);
          // notifySeller expects the auth User ID (authId), not the Seller record ID
          const seller = shopInfo?.seller as Record<string, unknown> | undefined;
          const sellerAuthId = seller?.authId as string | undefined;
          if (sellerAuthId) {
            await this.notificationProducer.notifySeller(
              sellerAuthId,
              'product.new_rating',
              {
                productName: product.name,
                rating: String(createRatingDto.rating),
                reviewerName: reviewData?.reviewerName || 'A customer',
              },
              { productId, ratingId: result.id, productSlug: product.slug }
            );
          }
        } catch (notifError) {
          this.logger.warn(
            `Failed to send review notification: ${notifError instanceof Error ? notifError.message : 'Unknown error'}`
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create rating: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Update an existing rating
   * Users can only update their own ratings
   */
  async updateRating(
    ratingId: string,
    userId: string,
    updateRatingDto: UpdateRatingDto
  ) {
    this.logger.log(`Updating rating ${ratingId} by user ${userId}`);

    // Find existing rating
    const existingRating = await this.prisma.productRating.findUnique({
      where: { id: ratingId },
    });

    if (!existingRating) {
      this.logger.error(`Rating not found: ${ratingId}`);
      throw new NotFoundException('Rating not found');
    }

    // Verify ownership
    if (existingRating.userId !== userId) {
      this.logger.error(
        `User ${userId} attempted to update rating ${ratingId} owned by ${existingRating.userId}`
      );
      throw new ForbiddenException('You can only update your own ratings');
    }

    // Use transaction to update rating and recalculate aggregates
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Update rating
        const updatedRating = await tx.productRating.update({
          where: { id: ratingId },
          data: { rating: updateRatingDto.rating },
        });

        // Recalculate product rating aggregates
        const aggregates = await tx.productRating.aggregate({
          where: { productId: existingRating.productId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        // Update product with new aggregates
        await tx.product.update({
          where: { id: existingRating.productId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            ratingCount: aggregates._count.rating || 0,
          },
        });

        return updatedRating;
      });

      this.logger.log(`Rating updated successfully - ratingId: ${result.id}`);
      this.logProducer.info('product-service', 'product', 'Product rating updated', {
        userId,
        metadata: { action: 'update_rating', ratingId, productId: existingRating.productId, rating: updateRatingDto.rating },
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update rating: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Delete a rating
   * Users can only delete their own ratings
   */
  async deleteRating(ratingId: string, userId: string) {
    this.logger.log(`Deleting rating ${ratingId} by user ${userId}`);

    // Find existing rating
    const existingRating = await this.prisma.productRating.findUnique({
      where: { id: ratingId },
    });

    if (!existingRating) {
      this.logger.error(`Rating not found: ${ratingId}`);
      throw new NotFoundException('Rating not found');
    }

    // Verify ownership
    if (existingRating.userId !== userId) {
      this.logger.error(
        `User ${userId} attempted to delete rating ${ratingId} owned by ${existingRating.userId}`
      );
      throw new ForbiddenException('You can only delete your own ratings');
    }

    // Use transaction to delete rating and recalculate aggregates
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete rating
        await tx.productRating.delete({
          where: { id: ratingId },
        });

        // Recalculate product rating aggregates
        const aggregates = await tx.productRating.aggregate({
          where: { productId: existingRating.productId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        // Update product with new aggregates
        await tx.product.update({
          where: { id: existingRating.productId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            ratingCount: aggregates._count.rating || 0,
          },
        });
      });

      this.logger.log(`Rating deleted successfully - ratingId: ${ratingId}`);
      this.logProducer.info('product-service', 'product', 'Product rating deleted', {
        userId,
        metadata: { action: 'delete_rating', ratingId, productId: existingRating.productId },
      });

      return { message: 'Rating deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete rating: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Get user's rating for a specific product
   * Returns null if user hasn't rated the product
   */
  async getUserRating(productId: string, userId: string) {
    this.logger.debug(
      `Getting rating for product ${productId} by user ${userId}`
    );

    const rating = await this.prisma.productRating.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    return rating;
  }

  /**
   * Get paginated reviews for a product with rating distribution
   */
  async getProductReviews(
    productId: string,
    page = 1,
    limit = 10,
    sort: 'newest' | 'highest' | 'lowest' = 'newest'
  ) {
    this.logger.log(
      `Getting reviews for product ${productId} - page: ${page}, limit: ${limit}, sort: ${sort}`
    );

    const skip = (page - 1) * limit;

    const orderBy: Record<string, string> =
      sort === 'highest'
        ? { rating: 'desc' }
        : sort === 'lowest'
          ? { rating: 'asc' }
          : { createdAt: 'desc' };

    const [reviews, total, aggregates, distribution] = await Promise.all([
      this.prisma.productRating.findMany({
        where: { productId },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.productRating.count({
        where: { productId },
      }),
      this.prisma.productRating.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.productRating.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      }),
    ]);

    // Build rating distribution object { "1": 0, "2": 0, "3": 5, "4": 10, "5": 20 }
    const ratingDistribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    distribution.forEach((group) => {
      ratingDistribution[String(group.rating)] = group._count.rating;
    });

    return {
      reviews,
      total,
      page,
      limit,
      averageRating: aggregates._avg.rating || 0,
      ratingCount: aggregates._count.rating || 0,
      ratingDistribution,
    };
  }

  /**
   * Add a seller response to a review
   * Verifies the review belongs to a product in the seller's shop
   */
  async addSellerResponse(
    ratingId: string,
    sellerId: string,
    response: string
  ) {
    this.logger.log(`Seller ${sellerId} responding to rating ${ratingId}`);

    // Find the rating and its product
    const rating = await this.prisma.productRating.findUnique({
      where: { id: ratingId },
      include: { product: true },
    });

    if (!rating) {
      throw new NotFoundException('Review not found');
    }

    // Verify the seller owns the shop that owns this product
    const ownsShop = await this.sellerClient.verifyShopOwnership(
      sellerId,
      rating.product.shopId
    );

    if (!ownsShop) {
      throw new ForbiddenException(
        'You can only respond to reviews on your own products'
      );
    }

    const updatedRating = await this.prisma.productRating.update({
      where: { id: ratingId },
      data: {
        sellerResponse: response,
        sellerResponseAt: new Date(),
      },
    });

    this.logger.log(`Seller response added to rating ${ratingId}`);
    this.logProducer.info('product-service', 'product', 'Seller responded to review', {
      userId: sellerId,
      metadata: { action: 'seller_response', ratingId, productId: rating.productId },
    });

    return updatedRating;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Sanitize product data types from multipart/form-data
   * Form data sends everything as strings, need to convert to proper types
   */
  private sanitizeProductData(dto: Record<string, unknown>): Record<string, unknown> & {
    price: number | undefined;
    salePrice: number | undefined;
    stock: number;
    hasVariants: boolean;
    isFeatured: boolean;
    isActive: boolean;
  } {
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
