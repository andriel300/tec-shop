import {
  Controller,
  Get,
  Query,
  Inject,
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Public Products')
@Controller('public/products')
export class PublicProductsController {
  constructor(@Inject('PRODUCT_SERVICE') private productService: ClientProxy) {}

  /**
   * Get all public products for marketplace frontend
   * Public endpoint - no authentication required
   */
  @Get()
  @Throttle({ long: { limit: 200, ttl: 60000 } }) // 200 requests per minute for public read operations
  @ApiOperation({
    summary: 'Get all public products (marketplace listing)',
    description: `
Retrieves all publicly available products for the marketplace frontend.

**Visibility Rules:**
- Only returns products with status: PUBLISHED
- Only returns products with visibility: PUBLIC
- Only returns active products (isActive: true)
- Excludes soft-deleted products

**Features:**
- Comprehensive filtering by category, brand, shop, price range, tags
- Full-text search in product name, description, and tags
- Multiple sort options (newest, price, popularity)
- Pagination support (limit up to 100 items per page)

**Use Cases:**
- Product listing pages
- Category pages
- Search results
- Shop storefronts
- Homepage product sections
    `,
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'brandId',
    required: false,
    description: 'Filter by brand ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiQuery({
    name: 'shopId',
    required: false,
    description: 'Filter by shop ID (for shop storefronts)',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Search query for product name, description, and tags (case-insensitive)',
    example: 'laptop',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter',
    example: 100,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter',
    example: 2000,
  })
  @ApiQuery({
    name: 'productType',
    required: false,
    enum: ['simple', 'variable', 'digital'],
    description: 'Filter by product type',
    example: 'simple',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    type: Boolean,
    description: 'Filter for featured products only',
    example: true,
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description:
      'Filter by tags (comma-separated). Products matching ANY tag will be returned.',
    example: 'new,sale,trending',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'price-asc', 'price-desc', 'popular', 'top-sales'],
    description: `Sort order:
- newest: Newest products first (createdAt desc)
- price-asc: Lowest price first
- price-desc: Highest price first
- popular: Most viewed products first
- top-sales: Best selling products first`,
    example: 'newest',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (1-100, default 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip (default 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              shopId: { type: 'string', example: '507f1f77bcf86cd799439014' },
              name: { type: 'string', example: 'Apple MacBook Pro 16"' },
              description: {
                type: 'string',
                example: 'Powerful laptop with M3 chip',
              },
              categoryId: { type: 'string' },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', example: 'Laptops' },
                  slug: { type: 'string', example: 'laptops' },
                },
              },
              brandId: { type: 'string' },
              brand: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', example: 'Apple' },
                  slug: { type: 'string', example: 'apple' },
                },
              },
              productType: {
                type: 'string',
                enum: ['SIMPLE', 'VARIABLE', 'DIGITAL'],
                example: 'SIMPLE',
              },
              price: { type: 'number', example: 2499 },
              salePrice: { type: 'number', nullable: true, example: 2299 },
              stock: { type: 'number', example: 50 },
              images: {
                type: 'array',
                items: { type: 'string' },
                example: [
                  'https://ik.imagekit.io/shop/products/laptop-1.jpg',
                  'https://ik.imagekit.io/shop/products/laptop-2.jpg',
                ],
              },
              hasVariants: { type: 'boolean', example: false },
              variants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    sku: { type: 'string', example: 'MBP16-M3-512-GRAY' },
                    attributes: {
                      type: 'object',
                      example: { Color: 'Space Gray', Storage: '512GB' },
                    },
                    price: { type: 'number', example: 2499 },
                    stock: { type: 'number', example: 25 },
                  },
                },
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                example: ['new', 'featured', 'apple'],
              },
              slug: {
                type: 'string',
                example: 'apple-macbook-pro-16-m3',
              },
              status: {
                type: 'string',
                enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED'],
                example: 'PUBLISHED',
              },
              visibility: {
                type: 'string',
                enum: ['PUBLIC', 'PRIVATE', 'PASSWORD_PROTECTED'],
                example: 'PUBLIC',
              },
              isActive: { type: 'boolean', example: true },
              isFeatured: { type: 'boolean', example: true },
              views: { type: 'number', example: 1250 },
              sales: { type: 'number', example: 45 },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-15T10:30:00Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-20T15:45:00Z',
              },
            },
          },
        },
        total: {
          type: 'number',
          example: 150,
          description: 'Total number of products matching filters',
        },
        limit: {
          type: 'number',
          example: 20,
          description: 'Number of items per page',
        },
        offset: {
          type: 'number',
          example: 0,
          description: 'Number of items skipped',
        },
        sort: {
          type: 'string',
          example: 'newest',
          description: 'Applied sort order',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllProducts(
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('shopId') shopId?: string,
    @Query('search') search?: string,
    @Query('minPrice', new DefaultValuePipe(undefined), ParseFloatPipe)
    minPrice?: number,
    @Query('maxPrice', new DefaultValuePipe(undefined), ParseFloatPipe)
    maxPrice?: number,
    @Query('productType') productType?: string,
    @Query('isFeatured', new DefaultValuePipe(undefined), ParseBoolPipe)
    isFeatured?: boolean,
    @Query('tags') tags?: string,
    @Query('sort', new DefaultValuePipe('newest')) sort?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ) {
    // Parse comma-separated tags
    const tagsArray = tags
      ? tags.split(',').map((tag) => tag.trim())
      : undefined;

    // Validate and cap limit
    const validatedLimit = Math.min(Math.max(limit || 20, 1), 100);

    return firstValueFrom(
      this.productService.send('product-get-public-products', {
        categoryId,
        brandId,
        shopId,
        search,
        minPrice,
        maxPrice,
        productType,
        isFeatured,
        tags: tagsArray,
        sort,
        limit: validatedLimit,
        offset: offset || 0,
      })
    );
  }
}
