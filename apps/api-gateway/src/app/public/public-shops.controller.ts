import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Public Shops')
@Controller('public/shops')
export class PublicShopsController {
  constructor(
    @Inject('SELLER_SERVICE') private sellerService: ClientProxy
  ) {}

  /**
   * Get all public shops with filtering
   * Public endpoint - no authentication required
   */
  @Get()
  @Throttle({ long: { limit: 200, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get all public shops (marketplace listing)',
    description: `
Retrieves all active shops for the marketplace frontend.

**Visibility Rules:**
- Only returns active shops (isActive: true)
- Includes seller information (name, country, verification status)

**Features:**
- Filter by category, country, minimum rating
- Full-text search in business name
- Pagination support (limit up to 100 items per page)
- Sorted by rating (highest first)

**Use Cases:**
- Shop listing pages
- Shop directory
- Shop search results
    `,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query for shop business name (case-insensitive)',
    example: 'Tech Store',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by shop category (case-insensitive)',
    example: 'Electronics',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by seller country (case-insensitive)',
    example: 'United States',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum shop rating (0-5)',
    example: 4.0,
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
    description: 'Shops retrieved successfully with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        shops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              businessName: { type: 'string', example: 'Tech Paradise' },
              bio: { type: 'string', example: 'Your one-stop tech shop' },
              category: { type: 'string', example: 'Electronics' },
              address: { type: 'string', example: '123 Main St' },
              city: { type: 'string', example: 'New York' },
              country: { type: 'string', example: 'United States' },
              phone: { type: 'string', example: '+1234567890' },
              logo: { type: 'string', example: 'https://...' },
              rating: { type: 'number', example: 4.5 },
              totalRatings: { type: 'number', example: 150 },
              isActive: { type: 'boolean', example: true },
              seller: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', example: 'John Doe' },
                  country: { type: 'string', example: 'United States' },
                  isVerified: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        total: {
          type: 'number',
          example: 50,
          description: 'Total number of shops matching filters',
        },
        limit: { type: 'number', example: 20 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllShops(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('country') country?: string,
    @Query('minRating') minRatingStr?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string
  ) {
    // Parse optional numeric values
    const minRating = minRatingStr ? parseFloat(minRatingStr) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Validate and cap limit
    const validatedLimit = Math.min(Math.max(limit, 1), 100);

    return firstValueFrom(
      this.sellerService.send('seller-get-filtered-shops', {
        search,
        category,
        country,
        minRating,
        limit: validatedLimit,
        offset,
      })
    );
  }

  @Get(':shopId')
  @ApiOperation({
    summary: 'Get public shop details by ID',
    description:
      'Returns public shop information including name, description, address, and ratings. No authentication required.',
  })
  @ApiParam({
    name: 'shopId',
    description: 'Shop ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Shop details retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Shop not found.',
  })
  @Throttle({ long: { limit: 200, ttl: 60000 } })
  async getShopById(@Param('shopId') shopId: string) {
    try {
      const shop = await firstValueFrom(
        this.sellerService.send('seller-get-shop-by-id', { shopId })
      );
      return shop;
    } catch (_error) {
      throw new NotFoundException('Shop not found');
    }
  }
}
