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

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(@Inject('PRODUCT_SERVICE') private productService: ClientProxy) {}

  /**
   * Get all categories (public)
   * Used by product creation form to show category options
   */
  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully.',
  })
  async getAllCategories(
    @Query('includeChildren') includeChildren?: boolean,
    @Query('onlyActive') onlyActive?: boolean,
    @Query('parentId') parentId?: string
  ) {
    return firstValueFrom(
      this.productService.send('product-get-all-categories', {
        includeChildren: includeChildren === true,
        onlyActive: onlyActive !== false, // Default to true
        parentId: parentId || null,
      })
    );
  }

  /**
   * Get category tree (public)
   * Returns hierarchical structure for navigation
   */
  @Get('tree')
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Get category tree' })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully.',
  })
  async getCategoryTree(@Query('onlyActive') onlyActive?: boolean) {
    return firstValueFrom(
      this.productService.send(
        'product-get-category-tree',
        onlyActive !== false
      )
    );
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
    return firstValueFrom(
      this.productService.send('product-get-category', {
        id,
        includeChildren: includeChildren === true,
        includeProducts: includeProducts === true,
      })
    );
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
    return firstValueFrom(
      this.productService.send('product-get-category-by-slug', {
        slug,
        includeChildren: includeChildren === true,
      })
    );
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
    return firstValueFrom(
      this.productService.send('product-create-category', createCategoryDto)
    );
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
    return firstValueFrom(
      this.productService.send('product-update-category', {
        id,
        updateCategoryDto,
      })
    );
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
    return firstValueFrom(
      this.productService.send('product-delete-category', id)
    );
  }
}
