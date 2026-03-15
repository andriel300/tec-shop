import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { LogCategory } from '@tec-shop/dto';
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
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class ProductCatalogService {
  private readonly logger = new Logger(ProductCatalogService.name);

  constructor(
    private readonly prisma: ProductPrismaService,
    private readonly sellerClient: SellerServiceClient,
    private readonly logProducer: LogProducerService,
  ) {}

  async create(
    sellerId: string,
    createProductDto: CreateProductDto & { shopId: string },
    imagePaths: string[]
  ) {
    try {
      this.logger.log(`Starting product creation for seller: ${sellerId}`);

      const { shopId } = createProductDto;

      if (!shopId) {
        this.logger.error('Product creation failed: No shopId provided');
        throw new RpcException({ statusCode: 400, message: 'Shop ID is required' });
      }

      this.logger.debug(`Verifying shop ownership - shopId: ${shopId}`);

      const [shopExists, ownsShop] = await Promise.all([
        this.sellerClient.verifyShopExists(shopId),
        this.sellerClient.verifyShopOwnership(sellerId, shopId),
      ]);

      this.logger.debug(
        `Shop verification result - exists: ${shopExists}, owns: ${ownsShop}`
      );

      if (!shopExists) {
        this.logger.error(`Shop not found: ${shopId}`);
        this.logProducer.warn('product-service', LogCategory.PRODUCT, 'Product creation failed - shop not found', {
          sellerId,
          metadata: { action: 'create_product', shopId },
        });
        throw new RpcException({ statusCode: 404, message: 'Shop not found' });
      }

      if (!ownsShop) {
        this.logger.error(`Seller ${sellerId} does not own shop ${shopId}`);
        this.logProducer.warn('product-service', LogCategory.PRODUCT, 'Product creation failed - shop ownership verification failed', {
          sellerId,
          metadata: { action: 'create_product', shopId },
        });
        throw new RpcException({ statusCode: 403, message: 'You do not have access to this shop' });
      }

      this.logger.debug(
        `Verifying category exists - categoryId: ${createProductDto.categoryId}`
      );
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        this.logger.error(`Category not found: ${createProductDto.categoryId}`);
        throw new RpcException({ statusCode: 404, message: `Category with ID ${createProductDto.categoryId} not found` });
      }

      if (createProductDto.brandId) {
        this.logger.debug(
          `Verifying brand exists - brandId: ${createProductDto.brandId}`
        );
        const brand = await this.prisma.brand.findUnique({
          where: { id: createProductDto.brandId },
        });

        if (!brand) {
          this.logger.error(`Brand not found: ${createProductDto.brandId}`);
          throw new RpcException({ statusCode: 404, message: `Brand with ID ${createProductDto.brandId} not found` });
        }
      }

      this.logger.debug(`Sanitizing product data - price: ${createProductDto.price} (${typeof createProductDto.price}), stock: ${createProductDto.stock} (${typeof createProductDto.stock})`);
      const sanitizedData = this.sanitizeProductData(createProductDto) as CreateProductDto & {
        price: number | undefined;
        salePrice: number | undefined;
        stock: number;
        hasVariants: boolean;
        isFeatured: boolean;
        isActive: boolean;
      };

      if (!sanitizedData.price || sanitizedData.price <= 0) {
        this.logger.error('Invalid price value');
        throw new RpcException({ statusCode: 400, message: 'Product price is required and must be greater than 0' });
      }

      this.logger.debug(`Generating slug for product: ${sanitizedData.name}`);
      const slug =
        sanitizedData.seo?.slug || this.generateSlug(sanitizedData.name);

      this.logger.debug(`Checking if slug already exists: ${slug}`);
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        this.logger.error(`Product with slug '${slug}' already exists`);
        throw new RpcException({ statusCode: 400, message: `Product with slug '${slug}' already exists` });
      }

      if (sanitizedData.productType === 'variable') {
        this.logger.debug('Validating variants for variable product');
        if (
          !Array.isArray(sanitizedData.variants) ||
          sanitizedData.variants.length === 0
        ) {
          this.logger.error('Variable product has no variants');
          throw new RpcException({ statusCode: 400, message: 'Variable products must have at least one variant' });
        }

        const skus = sanitizedData.variants.map((v: { sku: string }) => v.sku);
        const duplicates = skus.filter(
          (sku: string, index: number) => skus.indexOf(sku) !== index
        );
        if (duplicates.length > 0) {
          this.logger.error(`Duplicate SKUs found: ${duplicates.join(', ')}`);
          throw new RpcException({ statusCode: 400, message: `Duplicate SKUs found: ${duplicates.join(', ')}` });
        }

        const existingSkus = await this.prisma.productVariant.findMany({
          where: { sku: { in: skus } },
        });

        if (existingSkus.length > 0) {
          this.logger.error(
            `SKUs already exist: ${existingSkus.map((v) => v.sku).join(', ')}`
          );
          throw new RpcException({ statusCode: 400, message: `SKUs already exist: ${existingSkus.map((v) => v.sku).join(', ')}` });
        }
      }

      this.logger.log('Creating product in database transaction');

      const hasVariants =
        sanitizedData.variants && sanitizedData.variants.length > 0;

      const product = await this.prisma.$transaction(async (tx) => {
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
            deletedAt: null,
          },
        });

        this.logger.debug(`Product record created - ID: ${newProduct.id}`);

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
      this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product created', {
        sellerId,
        metadata: { action: 'create_product', productId: product.id, shopId },
      });

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
    },
    sellerId?: string
  ) {
    this.logger.debug(
      `findAll called with shopId: ${shopId}, filters: ${JSON.stringify(filters)}`
    );

    if (sellerId) {
      const isOwner = await this.sellerClient.verifyShopOwnership(sellerId, shopId);
      if (!isOwner) {
        throw new RpcException({ statusCode: 403, message: 'You do not have access to this shop' });
      }
    }

    const products = await this.prisma.product.findMany({
      where: {
        shopId,
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
      orderBy: { deletedAt: 'desc' },
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
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!product) {
      throw new RpcException({ statusCode: 404, message: `Product with ID ${id} not found` });
    }

    const ownsShop = await this.sellerClient.verifyShopOwnership(
      sellerId,
      product.shopId
    );
    if (!ownsShop) {
      throw new RpcException({ statusCode: 403, message: 'You do not have access to this product' });
    }

    return product;
  }

  async update(
    id: string,
    sellerId: string,
    updateProductDto: UpdateProductDto,
    newImagePaths?: string[]
  ) {
    await this.findOne(id, sellerId);

    const updateData: Record<string, unknown> = {};

    if (updateProductDto.name !== undefined) {
      updateData.name = updateProductDto.name;
      if (!updateProductDto.seo?.slug) {
        updateData.slug = this.generateSlug(updateProductDto.name);
      }
    }

    if (updateProductDto.description !== undefined)
      updateData.description = updateProductDto.description;
    if (updateProductDto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new RpcException({ statusCode: 404, message: `Category with ID ${updateProductDto.categoryId} not found` });
      }
      updateData.categoryId = updateProductDto.categoryId;
    }

    if (updateProductDto.brandId !== undefined) {
      if (updateProductDto.brandId) {
        const brand = await this.prisma.brand.findUnique({
          where: { id: updateProductDto.brandId },
        });
        if (!brand) {
          throw new RpcException({ statusCode: 404, message: `Brand with ID ${updateProductDto.brandId} not found` });
        }
      }
      updateData.brandId = updateProductDto.brandId;
    }

    if (updateProductDto.productType !== undefined)
      updateData.productType = this.mapProductType(updateProductDto.productType);
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
      updateData.visibility = this.mapProductVisibility(updateProductDto.visibility);
    if (updateProductDto.publishDate !== undefined)
      updateData.publishDate = updateProductDto.publishDate;
    if (updateProductDto.isFeatured !== undefined)
      updateData.isFeatured = updateProductDto.isFeatured;
    if (updateProductDto.isActive !== undefined)
      updateData.isActive = updateProductDto.isActive;

    if (newImagePaths && newImagePaths.length > 0) {
      updateData.images = newImagePaths;
    }

    if (updateProductDto.variants !== undefined) {
      updateData.hasVariants = updateProductDto.variants.length > 0;

      return this.prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
          where: { id },
          data: updateData,
        });

        await tx.productVariant.deleteMany({ where: { productId: id } });

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

        this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product updated with variants', {
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

    this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product updated', {
      sellerId,
      metadata: { action: 'update_product', productId: id },
    });

    return updated;
  }

  async remove(id: string, sellerId: string) {
    await this.findOne(id, sellerId);

    const result = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product soft-deleted', {
      sellerId,
      metadata: { action: 'delete_product', productId: id },
    });

    return result;
  }

  async restore(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new RpcException({ statusCode: 404, message: `Product with ID ${id} not found` });
    }

    const ownsShop = await this.sellerClient.verifyShopOwnership(
      sellerId,
      product.shopId
    );
    if (!ownsShop) {
      throw new RpcException({ statusCode: 403, message: 'You do not have access to this product' });
    }

    if (!product.deletedAt) {
      throw new RpcException({ statusCode: 400, message: 'Product is not deleted' });
    }

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

    this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product restored', {
      sellerId,
      metadata: { action: 'restore_product', productId: id },
    });

    return restored;
  }

  async findByIds(ids: string[]) {
    return this.prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: {
          select: { id: true, price: true, salePrice: true, stock: true, isActive: true },
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

  private sanitizeProductData(dto: Record<string, unknown>): Record<string, unknown> & {
    price: number | undefined;
    salePrice: number | undefined;
    stock: number;
    hasVariants: boolean;
    isFeatured: boolean;
    isActive: boolean;
  } {
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

    const toNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? undefined : num;
    };

    const toBoolean = (value: unknown): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    return {
      ...dto,
      price: toNumber(dto.price),
      salePrice: toNumber(dto.salePrice),
      stock: toNumber(dto.stock) || 0,
      hasVariants: toBoolean(dto.hasVariants),
      isFeatured: toBoolean(dto.isFeatured),
      isActive: dto.isActive !== undefined ? toBoolean(dto.isActive) : true,
      attributes: parseJSON(dto.attributes) || undefined,
      shipping: parseJSON(dto.shipping) || undefined,
      seo: parseJSON(dto.seo) || undefined,
      inventory: parseJSON(dto.inventory) || undefined,
      tags: parseJSON(dto.tags) || [],
      variants: parseJSON(dto.variants) || [],
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .concat(`-${Date.now()}`);
  }

  private mapProductType(type?: 'simple' | 'variable' | 'digital'): ProductType {
    if (!type) return ProductType.SIMPLE;
    const mapping: Record<string, ProductType> = {
      simple: ProductType.SIMPLE,
      variable: ProductType.VARIABLE,
      digital: ProductType.DIGITAL,
    };
    return mapping[type] || ProductType.SIMPLE;
  }

  private mapProductStatus(status?: 'draft' | 'published' | 'scheduled'): ProductStatus {
    if (!status) return ProductStatus.DRAFT;
    const mapping: Record<string, ProductStatus> = {
      draft: ProductStatus.DRAFT,
      published: ProductStatus.PUBLISHED,
      scheduled: ProductStatus.SCHEDULED,
    };
    return mapping[status] || ProductStatus.DRAFT;
  }

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
