import { Controller, Get, Query, Inject, Param } from '@nestjs/common';
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
    name: 'onSale',
    required: false,
    type: Boolean,
    description: 'Filter for products on sale (products with salePrice set)',
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
    name: 'colors',
    required: false,
    description:
      'Filter by variant colors (comma-separated). Products with variants matching ANY color will be returned.',
    example: 'Red,Blue,Black',
  })
  @ApiQuery({
    name: 'sizes',
    required: false,
    description:
      'Filter by variant sizes (comma-separated). Products with variants matching ANY size will be returned.',
    example: 'S,M,L,XL',
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
    @Query('minPrice') minPriceStr?: string,
    @Query('maxPrice') maxPriceStr?: string,
    @Query('productType') productType?: string,
    @Query('isFeatured') isFeaturedStr?: string,
    @Query('onSale') onSaleStr?: string,
    @Query('tags') tags?: string,
    @Query('colors') colors?: string,
    @Query('sizes') sizes?: string,
    @Query('sort') sort?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string
  ) {
    // Parse optional numeric and boolean values manually
    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const isFeatured = isFeaturedStr
      ? isFeaturedStr === 'true' || isFeaturedStr === '1'
      : undefined;
    const onSale = onSaleStr
      ? onSaleStr === 'true' || onSaleStr === '1'
      : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Parse comma-separated values
    const tagsArray = tags
      ? tags.split(',').map((tag) => tag.trim())
      : undefined;
    const colorsArray = colors
      ? colors.split(',').map((color) => color.trim())
      : undefined;
    const sizesArray = sizes
      ? sizes.split(',').map((size) => size.trim())
      : undefined;

    // Validate and cap limit
    const validatedLimit = Math.min(Math.max(limit, 1), 100);

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
        onSale,
        tags: tagsArray,
        colors: colorsArray,
        sizes: sizesArray,
        sort: sort || 'newest',
        limit: validatedLimit,
        offset,
      })
    );
  }

  /**
   * Get available filter options (colors, sizes) from active product variants
   * Public endpoint - no authentication required
   */
  @Get('filters/options')
  @Throttle({ long: { limit: 200, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get available filter options (public)',
    description: `
Retrieves all available filter options (colors, sizes) dynamically extracted from active product variants.

**Data Source:**
- Extracted from variant attributes of all published, public, active products
- Automatically updates as sellers add new product variants
- Returns only unique values, sorted alphabetically

**Use Cases:**
- Populate color filter options in product listing pages
- Populate size filter options in product listing pages
- Dynamic filter generation without hardcoding values

**Returns:**
- Array of unique color values
- Array of unique size values
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Filter options retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        colors: {
          type: 'array',
          items: { type: 'string' },
          example: ['Black', 'Blue', 'Green', 'Red', 'White', 'Yellow'],
          description: 'Sorted array of unique color values from product variants',
        },
        sizes: {
          type: 'array',
          items: { type: 'string' },
          example: ['L', 'M', 'S', 'XL', 'XS', 'XXL'],
          description: 'Sorted array of unique size values from product variants',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAvailableFilters() {
    return firstValueFrom(
      this.productService.send('product-get-available-filters', {})
    );
  }

  /**
   * Get paginated reviews for a product
   * Public endpoint - no authentication required
   */
  @Get('reviews/:productId')
  @Throttle({ long: { limit: 200, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get product reviews (public)',
    description: 'Retrieves paginated reviews for a product with rating distribution.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'highest', 'lowest'], example: 'newest' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('sort') sort?: string
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? Math.min(parseInt(limitStr, 10), 50) : 10;

    return firstValueFrom(
      this.productService.send('product-get-reviews', {
        productId,
        page: Math.max(page, 1),
        limit: Math.max(limit, 1),
        sort: sort || 'newest',
      })
    );
  }

  /**
   * Get single product by slug for product detail page
   * Public endpoint - no authentication required
   */
  @Get(':slug')
  @Throttle({ long: { limit: 200, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get product by slug (public)',
    description: `
Retrieves a single product by its slug for the product detail page.

**Visibility Rules:**
- Only returns products with status: PUBLISHED
- Only returns products with visibility: PUBLIC
- Only returns active products (isActive: true)
- Excludes soft-deleted products

**Returns:**
- Full product details including variants, images, ratings, etc.
- Category and brand information
- Shop details
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            shopId: { type: 'string' },
            name: { type: 'string', example: 'Apple MacBook Pro 16"' },
            slug: { type: 'string', example: 'apple-macbook-pro-16-m3' },
            description: { type: 'string' },
            categoryId: { type: 'string' },
            brandId: { type: 'string' },
            productType: { type: 'string', enum: ['SIMPLE', 'VARIABLE', 'DIGITAL'] },
            price: { type: 'number' },
            salePrice: { type: 'number', nullable: true },
            stock: { type: 'number' },
            images: { type: 'array', items: { type: 'string' } },
            hasVariants: { type: 'boolean' },
            variants: { type: 'array' },
            tags: { type: 'array', items: { type: 'string' } },
            status: { type: 'string' },
            visibility: { type: 'string' },
            isActive: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            views: { type: 'number' },
            sales: { type: 'number' },
            averageRating: { type: 'number', nullable: true },
            totalRatings: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or not available',
  })
  async getProductBySlug(@Param('slug') slug: string) {
    return firstValueFrom(
      this.productService.send('product-get-by-slug', { slug })
    );
  }
}
