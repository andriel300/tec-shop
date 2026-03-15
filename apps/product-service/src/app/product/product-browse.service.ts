import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { LogCategory } from '@tec-shop/dto';
import { ProductPrismaService } from '../../prisma/prisma.service';
import {
  ProductType,
  ProductStatus,
  ProductVisibility,
} from '@tec-shop/product-client';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class ProductBrowseService {
  private readonly logger = new Logger(ProductBrowseService.name);

  constructor(
    private readonly prisma: ProductPrismaService,
    private readonly logProducer: LogProducerService,
  ) {}

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
        categoryId, brandId, shopId, search, minPrice, maxPrice,
        productType, isFeatured, onSale, tags, colors, sizes, sort, limit, offset,
      })}`
    );

    const where: Record<string, unknown> = {
      status: ProductStatus.PUBLISHED,
      visibility: ProductVisibility.PUBLIC,
      isActive: true,
      deletedAt: null,

      ...(categoryId && {
        categoryId: categoryId.includes(',')
          ? { in: categoryId.split(',').map((id) => id.trim()) }
          : categoryId,
      }),
      ...(brandId && { brandId }),
      ...(shopId && { shopId }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(productType && {
        productType: this.mapProductType(productType as 'simple' | 'variable' | 'digital'),
      }),

      ...(minPrice !== undefined && maxPrice !== undefined && { price: { gte: minPrice, lte: maxPrice } }),
      ...(minPrice !== undefined && maxPrice === undefined && { price: { gte: minPrice } }),
      ...(minPrice === undefined && maxPrice !== undefined && { price: { lte: maxPrice } }),

      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),

      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { tags: { hasSome: [search] } },
        ],
      }),
    };

    if (onSale === true) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { salePrice: { not: null } },
      ];
    }

    if ((colors && colors.length > 0) || (sizes && sizes.length > 0)) {
      where.hasVariants = true;
    }

    const orderByMap: Record<string, Record<string, string>> = {
      newest: { createdAt: 'desc' },
      'price-asc': { price: 'asc' },
      'price-desc': { price: 'desc' },
      popular: { views: 'desc' },
      'top-sales': { sales: 'desc' },
    };

    const orderBy = orderByMap[sort] || orderByMap.newest;
    const hasVariantFilters = (colors && colors.length > 0) || (sizes && sizes.length > 0);

    let products;
    let total: number;

    if (hasVariantFilters) {
      const allProducts = await this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          variants: { where: { isActive: true } },
        },
        orderBy,
      });

      let filteredProducts = allProducts;

      if (colors && colors.length > 0) {
        filteredProducts = filteredProducts.filter((product) =>
          product.variants.some((variant) => {
            const attrs = variant.attributes as Record<string, unknown>;
            const colorValue = attrs.Color || attrs.color || attrs.COLOR || attrs.colour;
            return typeof colorValue === 'string' &&
              colors.some((c) => c.toLowerCase() === colorValue.toLowerCase());
          })
        );
      }

      if (sizes && sizes.length > 0) {
        filteredProducts = filteredProducts.filter((product) =>
          product.variants.some((variant) => {
            const attrs = variant.attributes as Record<string, unknown>;
            const sizeValue = attrs.Size || attrs.size || attrs.SIZE;
            return typeof sizeValue === 'string' &&
              sizes.some((s) => s.toLowerCase() === sizeValue.toLowerCase());
          })
        );
      }

      total = filteredProducts.length;
      products = filteredProducts.slice(offset, offset + limit);
    } else {
      const [fetchedProducts, count] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            category: true,
            brand: true,
            variants: { where: { isActive: true } },
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

    return { products, total, limit, offset, sort };
  }

  async getAvailableFilters() {
    this.logger.debug('Getting available filter options from product variants');

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
      select: { attributes: true },
    });

    const colorsSet = new Set<string>();
    const sizesSet = new Set<string>();

    variants.forEach((variant) => {
      const attrs = variant.attributes as Record<string, unknown>;
      Object.keys(attrs).forEach((key) => {
        const lowerKey = key.toLowerCase();
        const value = attrs[key];
        if (lowerKey === 'color' && typeof value === 'string') colorsSet.add(value);
        else if (lowerKey === 'size' && typeof value === 'string') sizesSet.add(value);
      });
    });

    const colors = Array.from(colorsSet).sort();
    const sizes = Array.from(sizesSet).sort();

    this.logger.log(`Found ${colors.length} unique colors and ${sizes.length} unique sizes`);

    return { colors, sizes };
  }

  async findPublicProductBySlug(slug: string) {
    this.logger.debug(`findPublicProductBySlug called with slug: ${slug}`);

    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.PUBLISHED,
        visibility: ProductVisibility.PUBLIC,
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        variants: {
          where: { isActive: true },
          select: {
            id: true, sku: true, attributes: true, price: true,
            salePrice: true, stock: true, image: true,
          },
        },
      },
    });

    if (!product) {
      this.logger.warn(`Product with slug ${slug} not found or not public`);
      throw new RpcException({ statusCode: 404, message: 'Product not found' });
    }

    this.logProducer.debug('product-service', LogCategory.PRODUCT, `Product found by slug: ${slug}`, {
      metadata: { productId: product.id },
    });

    this.logger.log(`Returning product: ${product.id} (${product.name})`);
    return product;
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
}
