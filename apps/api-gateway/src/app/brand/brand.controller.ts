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

const BRAND_LIST_TTL = 600; // seconds
const BRAND_DETAIL_TTL = 300; // seconds

@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
    private readonly cb: CircuitBreakerService,
    private readonly redisService: RedisService
  ) {}

  /**
   * Get all brands (public)
   * Used by product creation form to show brand options
   */
  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get all brands',
    description:
      'Retrieves a paginated list of all product brands. Supports search, filtering by active status, and pagination. Public endpoint - no authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully with pagination',
    schema: {
      type: 'object',
      properties: {
        brands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              name: { type: 'string', example: 'Apple' },
              slug: { type: 'string', example: 'apple' },
              description: {
                type: 'string',
                example: 'Premium consumer electronics and software',
              },
              logo: {
                type: 'string',
                nullable: true,
                example: 'https://example.com/logos/apple.png',
              },
              isActive: { type: 'boolean', example: true },
              isPopular: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 150 },
        limit: { type: 'number', example: 20 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  async getAllBrands(
    @Query('onlyActive') onlyActive?: boolean,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const params = {
      onlyActive: onlyActive !== false,
      search,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      offset: offset ? parseInt(String(offset), 10) : undefined,
    };
    const cacheKey = `cache:brands:list:${JSON.stringify(params)}`;
    try {
      const cached = await this.redisService.getJson<unknown>(cacheKey);
      if (cached !== null) return cached;
    } catch (_err) {
      // Redis unavailable — fall through to service call
    }

    const result = await this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-all-brands', params)
    ));
    try {
      await this.redisService.setJson(cacheKey, result, BRAND_LIST_TTL);
    } catch (_err) {
      // Redis unavailable — ignore write failure
    }
    return result;
  }

  /**
   * Get popular brands (public)
   */
  @Get('popular')
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({
    summary: 'Get popular brands',
    description:
      'Retrieves a list of popular brands marked by administrators. Useful for homepage features and marketing sections. Public endpoint - no authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular brands retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Apple' },
          slug: { type: 'string', example: 'apple' },
          description: {
            type: 'string',
            example: 'Premium consumer electronics and software',
          },
          logo: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/logos/apple.png',
          },
          isPopular: { type: 'boolean', example: true },
          isActive: { type: 'boolean', example: true },
          productCount: {
            type: 'number',
            example: 1250,
            description: 'Number of products associated with this brand',
          },
        },
      },
    },
  })
  async getPopularBrands(@Query('limit') limit?: number) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 10;
    const cacheKey = `cache:brands:popular:limit=${parsedLimit}`;
    try {
      const cached = await this.redisService.getJson<unknown>(cacheKey);
      if (cached !== null) return cached;
    } catch (_err) {
      // Redis unavailable — fall through to service call
    }

    const result = await this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-popular-brands', parsedLimit)
    ));
    try {
      await this.redisService.setJson(cacheKey, result, BRAND_LIST_TTL);
    } catch (_err) {
      // Redis unavailable — ignore write failure
    }
    return result;
  }

  /**
   * Get single brand by ID (public)
   */
  @Get(':id')
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiResponse({ status: 200, description: 'Brand retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Brand not found.' })
  async getBrand(
    @Param('id') id: string,
    @Query('includeProducts') includeProducts?: boolean
  ) {
    const includeProductsBool = includeProducts === true;
    const cacheKey = `cache:brands:detail:${id}:includeProducts=${includeProductsBool}`;
    try {
      const cached = await this.redisService.getJson<unknown>(cacheKey);
      if (cached !== null) return cached;
    } catch (_err) {
      // Redis unavailable — fall through to service call
    }

    const result = await this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-brand', {
        id,
        includeProducts: includeProductsBool,
      })
    ));
    try {
      await this.redisService.setJson(cacheKey, result, BRAND_DETAIL_TTL);
    } catch (_err) {
      // Redis unavailable — ignore write failure
    }
    return result;
  }

  /**
   * Get brand by slug (public)
   */
  @Get('slug/:slug')
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({ summary: 'Get brand by slug' })
  @ApiResponse({ status: 200, description: 'Brand retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Brand not found.' })
  async getBrandBySlug(
    @Param('slug') slug: string,
    @Query('includeProducts') includeProducts?: boolean
  ) {
    const includeProductsBool = includeProducts === true;
    const cacheKey = `cache:brands:slug:${slug}:includeProducts=${includeProductsBool}`;
    try {
      const cached = await this.redisService.getJson<unknown>(cacheKey);
      if (cached !== null) return cached;
    } catch (_err) {
      // Redis unavailable — fall through to service call
    }

    const result = await this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-get-brand-by-slug', {
        slug,
        includeProducts: includeProductsBool,
      })
    ));
    try {
      await this.redisService.setJson(cacheKey, result, BRAND_DETAIL_TTL);
    } catch (_err) {
      // Redis unavailable — ignore write failure
    }
    return result;
  }

  /**
   * Create brand (admin only)
   * Brands are centrally managed by administrators
   */
  @Post()
  @ApiOperation({ summary: 'Create a new brand (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiResponse({ status: 201, description: 'Brand created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Brand already exists.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  async createBrand(@Body() createBrandDto: Dto.CreateBrandDto) {
    return this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-create-brand', createBrandDto)
    ));
  }

  /**
   * Update brand (admin only - future enhancement)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a brand (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiResponse({ status: 200, description: 'Brand updated successfully.' })
  @ApiResponse({ status: 404, description: 'Brand not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  async updateBrand(
    @Param('id') id: string,
    @Body() updateBrandDto: Dto.UpdateBrandDto
  ) {
    return this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(
      this.productService.send('product-update-brand', {
        id,
        updateBrandDto,
      })
    ));
  }

  /**
   * Delete brand (admin only - future enhancement)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a brand (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiResponse({ status: 200, description: 'Brand deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Brand not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  async deleteBrand(@Param('id') id: string) {
    return this.cb.fire('PRODUCT_SERVICE', () => firstValueFrom(this.productService.send('product-delete-brand', id)));
  }
}
