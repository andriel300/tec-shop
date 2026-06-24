import {
  Controller, Get, Post, Param, Query, HttpCode, HttpStatus,
  NotFoundException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MonoPrismaService } from '../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';

@ApiTags('Public Products')
@Controller('public/products')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly prisma: MonoPrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List published products with filters' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'shopId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'price-asc', 'price-desc', 'popular', 'top-sales'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getAllProducts(
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('shopId') shopId?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sort') sort?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const where: any = {
      isActive: true,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      deletedAt: null,
    };

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (shopId) where.shopId = shopId;
    if (minPrice) where.price = { ...where.price, gte: Number(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: Number(maxPrice) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const orderBy: any = (() => {
      switch (sort) {
        case 'price-asc': return { price: 'asc' as const };
        case 'price-desc': return { price: 'desc' as const };
        case 'popular': return { views: 'desc' as const };
        case 'top-sales': return { sales: 'desc' as const };
        default: return { createdAt: 'desc' as const };
      }
    })();

    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const skip = offset ?? 0;

    const params = { categoryId, brandId, shopId, search, minPrice, maxPrice, sort, limit: take, offset: skip };
    const cacheKey = `cache:products:list:${JSON.stringify(params)}`;

    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached !== null) return cached;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
        orderBy,
        take,
        skip,
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = { products, total, limit: take, offset: skip, sort: sort || 'newest' };
    await this.redisService.setJson(cacheKey, result, 60);
    return result;
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductBySlug(@Param('slug') slug: string) {
    const cacheKey = `cache:products:slug:${slug}`;
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached !== null) return cached;

    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        deletedAt: null,
      },
      include: {
        category: true,
        brand: true,
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    await this.redisService.setJson(cacheKey, product, 30);
    return product;
  }

  @Get('reviews/:productId')
  @ApiOperation({ summary: 'Get product reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'highest', 'lowest'] })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ) {
    const pageNum = Math.max(page ?? 1, 1);
    const take = Math.min(Math.max(limit ?? 10, 1), 50);
    const skip = (pageNum - 1) * take;

    const orderBy: any = (() => {
      switch (sort) {
        case 'highest': return { rating: 'desc' as const };
        case 'lowest': return { rating: 'asc' as const };
        default: return { createdAt: 'desc' as const };
      }
    })();

    const [reviews, total, aggregation] = await Promise.all([
      this.prisma.productRating.findMany({
        where: { productId },
        orderBy,
        take,
        skip,
      }),
      this.prisma.productRating.count({ where: { productId } }),
      this.prisma.productRating.groupBy({
        by: ['rating'],
        where: { productId },
        _count: true,
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let ratingCount = 0;
    for (const g of aggregation) {
      distribution[g.rating] = g._count;
      totalRating += g.rating * g._count;
      ratingCount += g._count;
    }
    const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 100) / 100 : 0;

    return { reviews, distribution, averageRating, total, page: pageNum, limit: take };
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track product view' })
  @ApiResponse({ status: 204, description: 'View tracked' })
  async trackView(@Param('id') id: string): Promise<void> {
    try {
      await this.prisma.product.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to track view for product ${id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
