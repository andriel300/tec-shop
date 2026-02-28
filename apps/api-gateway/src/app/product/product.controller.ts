import {
  Body,
  Controller,
  Inject,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ClientProxy } from '@nestjs/microservices';
import { FilesInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import * as Dto from '@tec-shop/dto';
import { ImageKitService } from '@tec-shop/shared/imagekit';

// File validation configuration
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 4;
const REVIEW_MAX_IMAGES = 3;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

@ApiTags('Products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productService: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderService: ClientProxy,
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
    private readonly imagekitService: ImageKitService
  ) {}

  /**
   * Validate uploaded files
   */
  private validateFiles(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(`Maximum ${MAX_FILES} images allowed`);
    }

    files.forEach((file) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.originalname}. Only JPEG, PNG, GIF, and WebP images are allowed`
        );
      }

      if (file.size > FILE_SIZE_LIMIT) {
        throw new BadRequestException(
          `File too large: ${file.originalname}. Maximum size is 5MB`
        );
      }
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product with images (seller only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FilesInterceptor('images', 4))
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid product data or missing images.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async createProduct(
    @Req() req: Record<string, unknown>,
    @Body() productData: Dto.CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    // Validate files
    this.validateFiles(files);

    // Upload images to ImageKit
    const uploadResults = await this.imagekitService.uploadMultipleFiles(
      files.map((file) => ({
        buffer: file.buffer,
        originalname: file.originalname,
      })),
      'products'
    );

    // Extract URLs from upload results
    const imageUrls = uploadResults.map((result) => result.url);

    return firstValueFrom(
      this.productService.send('product-create-product', {
        sellerId: user.userId,
        productData,
        imageUrls,
      })
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for seller shop (seller only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async getProducts(
    @Req() req: Record<string, unknown>,
    @Query('shopId') shopId: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('search') search?: string
  ) {
    return firstValueFrom(
      this.productService.send('product-get-products', {
        shopId,
        filters: {
          category,
          isActive,
          isFeatured,
          search,
        },
      })
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID (seller only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async getProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    return firstValueFrom(
      this.productService.send('product-get-product', {
        id,
        sellerId: user.userId,
      })
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a product with optional new images (seller only)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FilesInterceptor('images', 4))
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async updateProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string,
    @Body() productData: Dto.UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    let imageUrls: string[] | undefined;

    // If files are provided, validate and upload to ImageKit
    if (files && files.length > 0) {
      // Validate files (but don't require at least one for updates)
      if (files.length > MAX_FILES) {
        throw new BadRequestException(`Maximum ${MAX_FILES} images allowed`);
      }

      files.forEach((file) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          throw new BadRequestException(
            `Invalid file type: ${file.originalname}. Only JPEG, PNG, GIF, and WebP images are allowed`
          );
        }

        if (file.size > FILE_SIZE_LIMIT) {
          throw new BadRequestException(
            `File too large: ${file.originalname}. Maximum size is 5MB`
          );
        }
      });

      // Upload images to ImageKit
      const uploadResults = await this.imagekitService.uploadMultipleFiles(
        files.map((file) => ({
          buffer: file.buffer,
          originalname: file.originalname,
        })),
        'products'
      );

      imageUrls = uploadResults.map((result) => result.url);
    }

    return firstValueFrom(
      this.productService.send('product-update-product', {
        id,
        sellerId: user.userId,
        productData,
        imageUrls,
      })
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product (seller only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async deleteProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    return firstValueFrom(
      this.productService.send('product-delete-product', {
        id,
        sellerId: user.userId,
      })
    );
  }

  // ============================================
  // Product Ratings Endpoints
  // ============================================

  @Post(':productId/ratings')
  @ApiOperation({
    summary: 'Create or update a review for a product (requires delivered order)',
    description:
      'Allows authenticated users who have received a delivered order to review a product. Supports text review and up to 3 images.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', REVIEW_MAX_IMAGES))
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiResponse({
    status: 201,
    description: 'Rating created or updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid rating value or user has not purchased this product.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Product not found or not published.',
  })
  async createRating(
    @Req() req: Record<string, unknown>,
    @Param('productId') productId: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    // Parse rating from form-data (comes as string)
    const rating = typeof body.rating === 'string' ? parseInt(body.rating as string, 10) : body.rating as number;
    const title = body.title as string | undefined;
    const content = body.content as string | undefined;

    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Verify purchase: user must have at least one DELIVERED order containing this product
    try {
      const orders = await firstValueFrom(
        this.orderService.send('get-user-orders', user.userId)
      ) as Array<{ status: string; items: Array<{ productId: string }> }>;

      const hasDeliveredOrder = orders.some(
        (order) =>
          order.status === 'DELIVERED' &&
          order.items.some((item) => item.productId === productId)
      );

      if (!hasDeliveredOrder) {
        throw new BadRequestException(
          'You can only review products from orders that have been delivered'
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.warn(
        `Failed to verify purchase for user ${user.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new BadRequestException('Unable to verify purchase. Please try again later.');
    }

    // Upload review images if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      // Validate review images
      files.forEach((file) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          throw new BadRequestException(
            `Invalid file type: ${file.originalname}. Only JPEG, PNG, GIF, and WebP images are allowed`
          );
        }
        if (file.size > FILE_SIZE_LIMIT) {
          throw new BadRequestException(
            `File too large: ${file.originalname}. Maximum size is 5MB`
          );
        }
      });

      const uploadResults = await this.imagekitService.uploadMultipleFiles(
        files.map((file) => ({
          buffer: file.buffer,
          originalname: file.originalname,
        })),
        'reviews'
      );
      imageUrls = uploadResults.map((result) => result.url);
    }

    // Fetch reviewer profile (non-critical)
    let reviewerName: string | undefined;
    let reviewerAvatar: string | undefined;
    try {
      const profile = await firstValueFrom(
        this.userService.send('get-user-profile', user.userId)
      ) as { name?: string; avatar?: string } | null;
      if (profile) {
        reviewerName = profile.name || user.username;
        reviewerAvatar = profile.avatar;
      }
    } catch {
      reviewerName = user.username;
    }

    return firstValueFrom(
      this.productService.send('product-create-rating', {
        productId,
        userId: user.userId,
        rating: { rating },
        reviewData: {
          title,
          content,
          images: imageUrls,
          reviewerName: reviewerName || user.username,
          reviewerAvatar,
        },
      })
    );
  }

  @Put('ratings/:ratingId')
  @ApiOperation({
    summary: 'Update an existing rating (authenticated users, owner only)',
    description: 'Allows users to update their own rating. Only the rating owner can update it.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiResponse({ status: 200, description: 'Rating updated successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid rating value (must be 1-5 stars).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update your own rating.',
  })
  @ApiResponse({ status: 404, description: 'Rating not found.' })
  async updateRating(
    @Req() req: Record<string, unknown>,
    @Param('ratingId') ratingId: string,
    @Body() ratingDto: Dto.UpdateRatingDto
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    return firstValueFrom(
      this.productService.send('product-update-rating', {
        ratingId,
        userId: user.userId,
        rating: ratingDto,
      })
    );
  }

  @Delete('ratings/:ratingId')
  @ApiOperation({
    summary: 'Delete a rating (authenticated users, owner only)',
    description: 'Allows users to delete their own rating. Only the rating owner can delete it.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiResponse({ status: 200, description: 'Rating deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only delete your own rating.',
  })
  @ApiResponse({ status: 404, description: 'Rating not found.' })
  async deleteRating(
    @Req() req: Record<string, unknown>,
    @Param('ratingId') ratingId: string
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    return firstValueFrom(
      this.productService.send('product-delete-rating', {
        ratingId,
        userId: user.userId,
      })
    );
  }

  @Get(':productId/ratings/me')
  @ApiOperation({
    summary: 'Get current user rating for a product (authenticated users)',
    description:
      'Returns the current authenticated user rating for a specific product. Returns null if user has not rated the product yet.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ long: { limit: 100, ttl: 60000 } })
  @ApiResponse({
    status: 200,
    description: 'User rating retrieved successfully (or null if not rated).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async getUserRating(
    @Req() req: Record<string, unknown>,
    @Param('productId') productId: string
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    return firstValueFrom(
      this.productService.send('product-get-user-rating', {
        productId,
        userId: user.userId,
      })
    );
  }

  @Post('ratings/:ratingId/reply')
  @ApiOperation({
    summary: 'Add seller response to a review (seller only)',
    description: 'Allows sellers to reply to reviews on their products.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiResponse({ status: 200, description: 'Seller response added successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required or not your product.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  async addSellerResponse(
    @Req() req: Record<string, unknown>,
    @Param('ratingId') ratingId: string,
    @Body() body: Dto.SellerResponseDto
  ) {
    const user = req.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    };

    return firstValueFrom(
      this.productService.send('product-add-seller-response', {
        ratingId,
        sellerId: user.userId,
        response: body.response,
      })
    );
  }
}
