import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import * as Dto from '@tec-shop/dto';

import { Throttle } from '@nestjs/throttler';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';
import { RedisService } from '@tec-shop/redis-client';

const CATEGORY_LIST_TTL = 600; // seconds — tree/list rarely changes
const CATEGORY_DETAIL_TTL = 300; // seconds — individual category

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
    private readonly cb: CircuitBreakerService,
    private readonly redisService: RedisService
  ) {}

  /**
   * Get all categories (public)
   * Used by product creation form to show category options
   */
  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({
    summary: 'Get all categories',
    description:
      'Retrieves a list of all product categories. Supports filtering by parent category, active status, and optionally includes child categories. Public endpoint - no authentication required.',
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
            example: 'Electronic devices and accessories',
          },
          parentId: {
            type: 'string',
            nullable: true,
            example: null,
          },
          level: { type: 'number', example: 0 },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          children: {
            type: 'array',
            description: 'Included when includeChildren=true',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async getAllCategories(
    @Query('includeChildren') includeChildren?: boolean,
    @Query('onlyActive') onlyActive?: boolean,
    @Query('parentId') parentId?: string
  ) {
    const params = {
      includeChildren: includeChildren === true,
      onlyActive: onlyActive !== false,
      parentId: parentId || null,
    };
    const cacheKey = `cache:categories:list:${JSON.stringify(params)}`;
    try {
      const cached = await this.redisService.getJson<unknown>(cacheKey);
      if (cached !== null) return cached;
    } catch (_err) {
      // Redis unavailable — fall through to service call
    }

    const result = await this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-all-categories', params)
    ));
    try {
      await this.redisService.setJson(cacheKey, result, CATEGORY_LIST_TTL);
    } catch (_err) {
      // Redis unavailable — ignore write failure
    }
    return result;
  }

  /**
   * Get category tree (public)
   * Returns hierarchical structure for navigation
   */
  @Get('tree')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get category tree',
    description:
      'Retrieves the complete category hierarchy as a nested tree structure. Ideal for building navigation menus and category filters. Public endpoint - no authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully',
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
            example: 'Electronic devices and accessories',
          },
          level: { type: 'number', example: 0 },
          isActive: { type: 'boolean', example: true },
          children: {
            type: 'array',
            description: 'Nested child categories (recursive structure)',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                name: { type: 'string', example: 'Smartphones' },
                slug: { type: 'string', example: 'smartphones' },
                level: { type: 'number', example: 1 },
                parentId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                children: {
                  type: 'array',
                  description: 'Further nested categories',
                  items: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getCategoryTree(@Query('onlyActive') onlyActive?: boolean) {
    const onlyActiveBool = onlyActive !== false;
    const cacheKey = `cache:categories:tree:onlyActive=${onlyActiveBool}`;
    try {
      const cached = await this.redisService.getJson<unknown>(cacheKey);
      if (cached !== null) return cached;
    } catch (_err) {
      // Redis unavailable — fall through to service call
    }

    const result = await this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-category-tree', onlyActiveBool)
    ));
    try {
      await this.redisService.setJson(cacheKey, result, CATEGORY_LIST_TTL);
    } catch (_err) {
      // Redis unavailable — ignore write failure
    }
    return result;
  }

  /**
   * Get single category by ID (public)
   */
  @Get(':id')
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async getCategory(
    @Param('id') id: string,
    @Query('includeChildren') includeChildren?: boolean,
    @Query('includeProducts') includeProducts?: boolean
  ) {
    const includeChildrenBool = includeChildren === true;
    const includeProductsBool = includeProducts === true;
    const cacheKey = `cache:categories:detail:${id}:includeChildren=${includeChildrenBool}:includeProducts=${includeProductsBool}`;
    try {
      const cached = await this.redisService.getJson<unknown>(cacheKey);
      if (cached !== null) return cached;
    } catch (_err) {
      // Redis unavailable — fall through to service call
    }

    const result = await this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-category', {
        id,
        includeChildren: includeChildrenBool,
        includeProducts: includeProductsBool,
      })
    ));
    try {
      await this.redisService.setJson(cacheKey, result, CATEGORY_DETAIL_TTL);
    } catch (_err) {
      // Redis unavailable — ignore write failure
    }
    return result;
  }

  /**
   * Get category by slug (public)
   */
  @Get('slug/:slug')
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async getCategoryBySlug(
    @Param('slug') slug: string,
    @Query('includeChildren') includeChildren?: boolean
  ) {
    return this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-category-by-slug', {
        slug,
        includeChildren: includeChildren === true,
      })
    ));
  }

  /**
   * Create category (admin only - future enhancement)
   */
  @Post()
  @ApiOperation({ summary: 'Create a new category (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  async createCategory(@Body() createCategoryDto: Dto.CreateCategoryDto) {
    return this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-create-category', createCategoryDto)
    ));
  }

  /**
   * Update category (admin only - future enhancement)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a category (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: Dto.UpdateCategoryDto
  ) {
    return this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-update-category', {
        id,
        updateCategoryDto,
      })
    ));
  }

  /**
   * Delete category (admin only - future enhancement)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiResponse({ status: 200, description: 'Category deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  async deleteCategory(@Param('id') id: string) {
    return this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-delete-category', id)
    ));
  }
}
