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
  UploadedFile,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  CreateSellerProfileDto,
  CreateShopDto,
  UpdateShopDto,
} from '@tec-shop/dto';
import * as Dto from '@tec-shop/dto';
import { ImageKitService } from '@tec-shop/shared/imagekit';

// File validation configuration
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 4;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

@ApiTags('Seller')
@Controller('seller')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellerController {
  private readonly logger = new Logger(SellerController.name);

  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productService: ClientProxy,
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

  @Get('profile')
  @ApiOperation({ summary: 'Get seller profile' })
  @ApiResponse({
    status: 200,
    description: 'Seller profile retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async getProfile(@Req() request: { user: { userId: string } }) {
    return await firstValueFrom(
      this.sellerService.send('get-seller-profile', request.user.userId)
    );
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update seller profile' })
  @ApiResponse({
    status: 200,
    description: 'Seller profile updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async updateProfile(
    @Req() request: { user: { userId: string } },
    @Body() updateData: Partial<CreateSellerProfileDto>
  ) {
    return await firstValueFrom(
      this.sellerService.send('update-seller-profile', {
        authId: request.user.userId,
        updateData,
      })
    );
  }

  @Post('shop/create')
  @ApiOperation({ summary: 'Create a new seller shop' })
  @ApiResponse({
    status: 201,
    description: 'Shop created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Shop already exists or invalid data.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async createShop(
    @Req() request: { user: { userId: string } },
    @Body() shopData: CreateShopDto
  ) {
    return await firstValueFrom(
      this.sellerService.send('create-shop', {
        authId: request.user.userId,
        shopData,
      })
    );
  }

  @Post('shop')
  @ApiOperation({ summary: 'Create or update seller shop' })
  @ApiResponse({
    status: 201,
    description: 'Shop created or updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async createOrUpdateShop(
    @Req() request: { user: { userId: string } },
    @Body() shopData: UpdateShopDto
  ) {
    return await firstValueFrom(
      this.sellerService.send('create-or-update-shop', {
        authId: request.user.userId,
        shopData,
      })
    );
  }

  @Get('shop')
  @ApiOperation({ summary: 'Get seller shop' })
  @ApiResponse({
    status: 200,
    description: 'Shop information retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async getShop(@Req() request: { user: { userId: string } }) {
    return await firstValueFrom(
      this.sellerService.send('get-seller-shop', request.user.userId)
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get seller dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async getDashboardData(@Req() request: { user: { userId: string } }) {
    return await firstValueFrom(
      this.sellerService.send('get-seller-dashboard', request.user.userId)
    );
  }

  // ============================================
  // IMAGE UPLOAD ENDPOINT
  // ============================================

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload a single image to ImageKit (seller only)' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FileInterceptor('image'))
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully.',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'ImageKit URL of uploaded image' },
        fileId: { type: 'string', description: 'ImageKit file ID' },
        name: { type: 'string', description: 'File name' },
        size: { type: 'number', description: 'File size in bytes' },
        filePath: { type: 'string', description: 'File path in ImageKit' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or file too large.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder = 'products'
  ) {
    // Validate file exists
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed`
      );
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMIT) {
      throw new BadRequestException(
        `File too large. Maximum size is 5MB`
      );
    }

    // Upload to ImageKit
    const uploadResult = await this.imagekitService.uploadFile(
      file.buffer,
      file.originalname,
      folder
    );

    // Return ImageKit metadata
    return {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      name: uploadResult.name,
      size: file.size,
      filePath: uploadResult.filePath,
    };
  }

  // ============================================
  // PRODUCT MANAGEMENT ENDPOINTS
  // ============================================

  @Post('products')
  @ApiOperation({ summary: 'Create a new product with images (seller only)' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(RolesGuard)
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

    // Get seller's shop (one seller = one shop)
    const shop = await firstValueFrom(
      this.sellerService.send('get-seller-shop', user.userId)
    );

    if (!shop || !shop.id) {
      throw new BadRequestException(
        'Shop not found. Please set up your shop first.'
      );
    }

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
        shopId: shop.id, // Auto-populated from seller's shop
        productData,
        imageUrls,
      })
    );
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products for seller shop (seller only)' })
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async getProducts(
    @Req() req: Record<string, unknown>,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('search') search?: string
  ) {
    const user = req.user as { userId: string };

    // Get seller's shop (one seller = one shop)
    const shop = await firstValueFrom(
      this.sellerService.send('get-seller-shop', user.userId)
    );

    if (!shop || !shop.id) {
      throw new BadRequestException(
        'Shop not found. Please set up your shop first.'
      );
    }

    this.logger.debug(
      `Fetching products for seller: ${user.userId}, shop: ${shop.id}`
    );

    const products = await firstValueFrom(
      this.productService.send('product-get-products', {
        sellerId: user.userId,
        shopId: shop.id, // Auto-populated from seller's shop
        filters: {
          category,
          isActive,
          isFeatured,
          search,
        },
      })
    );

    this.logger.debug(`Found ${products.length} products`);

    return products;
  }

  @Get('products/trash')
  @ApiOperation({ summary: 'Get deleted products (trash) for seller shop' })
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Deleted products retrieved successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async getDeletedProducts(
    @Req() req: Record<string, unknown>,
    @Query('category') category?: string,
    @Query('search') search?: string
  ) {
    const user = req.user as { userId: string };

    // Get seller's shop (one seller = one shop)
    const shop = await firstValueFrom(
      this.sellerService.send('get-seller-shop', user.userId)
    );

    if (!shop || !shop.id) {
      throw new BadRequestException(
        'Shop not found. Please set up your shop first.'
      );
    }

    this.logger.debug(
      `Fetching deleted products for seller: ${user.userId}, shop: ${shop.id}`
    );

    const products = await firstValueFrom(
      this.productService.send('product-get-deleted-products', {
        shopId: shop.id,
        filters: {
          categoryId: category,
          search,
        },
      })
    );

    this.logger.debug(`Found ${products.length} deleted products`);

    return products;
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a single product by ID (seller only)' })
  @UseGuards(RolesGuard)
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
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.productService.send('product-get-product', {
        id,
        sellerId: user.userId,
      })
    );
  }

  @Put('products/:id')
  @ApiOperation({
    summary: 'Update a product (seller only)',
    description: 'Updates product with JSON payload. Since eager upload is used, all images are already ImageKit URLs.',
  })
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async updateProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string,
    @Body() productData: Dto.UpdateProductDto & { images?: string[] }
  ) {
    const user = req.user as { userId: string };

    // Extract images array from productData (already ImageKit URLs via eager upload)
    const { images, ...cleanProductData } = productData;

    return firstValueFrom(
      this.productService.send('product-update-product', {
        id,
        sellerId: user.userId,
        productData: cleanProductData,
        imageUrls: images, // Pass images as imageUrls to microservice
      })
    );
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a product (seller only)' })
  @UseGuards(RolesGuard)
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
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.productService.send('product-delete-product', {
        id,
        sellerId: user.userId,
      })
    );
  }

  @Post('products/:id/restore')
  @ApiOperation({ summary: 'Restore a deleted product (seller only)' })
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Product restored successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 400, description: 'Product is not deleted.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async restoreProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string
  ) {
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.productService.send('product-restore-product', {
        id,
        sellerId: user.userId,
      })
    );
  }
}

@ApiTags('Public Shops')
@Controller('public/shops')
export class PublicShopsController {
  private readonly logger = new Logger(PublicShopsController.name);

  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get filtered shops (public)',
    description: 'Retrieves shops with filtering by category, country, rating, etc.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query for shop name or description',
    example: 'Tech Store',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by shop category',
    example: 'Electronics',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by country',
    example: 'USA',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum shop rating (0-5)',
    example: 4,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default 12)',
    example: 12,
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
    description: 'Shops retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        shops: { type: 'array' },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  async getFilteredShops(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('country') country?: string,
    @Query('minRating') minRatingStr?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string
  ) {
    this.logger.log('Fetching filtered shops');

    const minRating = minRatingStr ? parseFloat(minRatingStr) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 12;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return firstValueFrom(
      this.sellerService.send('seller-get-filtered-shops', {
        search,
        category,
        country,
        minRating,
        limit,
        offset,
      })
    );
  }

  @Get(':shopId')
  @ApiOperation({
    summary: 'Get shop details by ID (public)',
    description: 'Retrieves shop information for displaying on product pages and shop storefronts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Shop details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        businessName: { type: 'string', example: 'Tech Store' },
        description: { type: 'string', example: 'Best electronics in town' },
        logo: { type: 'string', nullable: true },
        banner: { type: 'string', nullable: true },
        contactEmail: { type: 'string', example: 'shop@example.com' },
        contactPhone: { type: 'string', nullable: true },
        address: { type: 'object', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Shop not found',
  })
  async getShopById(@Param('shopId') shopId: string) {
    this.logger.log(`Fetching shop details for shopId: ${shopId}`);

    return firstValueFrom(
      this.sellerService.send('seller-get-shop-by-id', { shopId })
    );
  }
}
