import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Public - Categories')
@Controller('categories')
export class PublicCategoriesController {
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productService: ClientProxy
  ) {}

  /**
   * Get all categories
   * Public endpoint - no authentication required
   */
  @Get()
  @Throttle({ long: { limit: 200, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get all categories (public)',
    description: `
Retrieves all product categories for the marketplace.
Returns only active categories by default.

**Use Cases:**
- Category filter in product listing page
- Navigation menu
- Category browsing
    `,
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Only return active categories (default: true)',
    example: true,
  })
  @ApiQuery({
    name: 'includeChildren',
    required: false,
    type: Boolean,
    description: 'Include child categories in hierarchical structure (default: false)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Electronics' },
          slug: { type: 'string', example: 'electronics' },
          description: {
            type: 'string',
            nullable: true,
            example: 'Electronic devices and accessories',
          },
          image: {
            type: 'string',
            nullable: true,
            example: 'https://ik.imagekit.io/shop/categories/electronics.jpg',
          },
          parentId: {
            type: 'string',
            nullable: true,
            example: null,
          },
          position: { type: 'number', example: 1 },
          isActive: { type: 'boolean', example: true },
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
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllCategories(
    @Query('onlyActive') onlyActiveStr?: string,
    @Query('includeChildren') includeChildrenStr?: string
  ) {
    const onlyActive = onlyActiveStr === 'false' ? false : true; // Default true
    const includeChildren = includeChildrenStr === 'true' ? true : false; // Default false

    return firstValueFrom(
      this.productService.send('product-get-all-categories', {
        onlyActive,
        includeChildren,
      })
    );
  }
}
