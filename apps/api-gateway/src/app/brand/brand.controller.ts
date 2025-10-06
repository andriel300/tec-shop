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
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import * as Dto from '@tec-shop/dto';

import { Throttle } from '@nestjs/throttler';

@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(@Inject('PRODUCT_SERVICE') private productService: ClientProxy) {}

  /**
   * Get all brands (public)
   * Used by product creation form to show brand options
   */
  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all brands' })
  @ApiResponse({ status: 200, description: 'Brands retrieved successfully.' })
  async getAllBrands(
    @Query('onlyActive') onlyActive?: boolean,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return firstValueFrom(
      this.productService.send('product-get-all-brands', {
        onlyActive: onlyActive !== false, // Default to true
        search,
        limit: limit ? parseInt(String(limit), 10) : undefined,
        offset: offset ? parseInt(String(offset), 10) : undefined,
      })
    );
  }

  /**
   * Get popular brands (public)
   */
  @Get('popular')
  @ApiOperation({ summary: 'Get popular brands' })
  @ApiResponse({
    status: 200,
    description: 'Popular brands retrieved successfully.',
  })
  async getPopularBrands(@Query('limit') limit?: number) {
    return firstValueFrom(
      this.productService.send(
        'product-get-popular-brands',
        limit ? parseInt(String(limit), 10) : 10
      )
    );
  }

  /**
   * Get single brand by ID (public)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiResponse({ status: 200, description: 'Brand retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Brand not found.' })
  async getBrand(
    @Param('id') id: string,
    @Query('includeProducts') includeProducts?: boolean
  ) {
    return firstValueFrom(
      this.productService.send('product-get-brand', {
        id,
        includeProducts: includeProducts === true,
      })
    );
  }

  /**
   * Get brand by slug (public)
   */
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get brand by slug' })
  @ApiResponse({ status: 200, description: 'Brand retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Brand not found.' })
  async getBrandBySlug(
    @Param('slug') slug: string,
    @Query('includeProducts') includeProducts?: boolean
  ) {
    return firstValueFrom(
      this.productService.send('product-get-brand-by-slug', {
        slug,
        includeProducts: includeProducts === true,
      })
    );
  }

  /**
   * Create brand - Hybrid approach
   * Sellers can create brands on-the-fly during product creation
   * Admins can also create brands for better organization
   */
  @Post()
  @ApiOperation({ summary: 'Create a new brand (sellers and admins)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @ApiResponse({ status: 201, description: 'Brand created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Brand already exists.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller or Admin access required.',
  })
  async createBrand(@Body() createBrandDto: Dto.CreateBrandDto) {
    return firstValueFrom(
      this.productService.send('product-create-brand', createBrandDto)
    );
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
    return firstValueFrom(
      this.productService.send('product-update-brand', {
        id,
        updateBrandDto,
      })
    );
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
    return firstValueFrom(this.productService.send('product-delete-brand', id));
  }
}
