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
    @Query('shopId') shopId?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('search') search?: string
  ) {
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.productService.send('product-get-products', {
        sellerId: user.userId,
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
    summary: 'Update a product with optional new images (seller only)',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(RolesGuard)
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
    const user = req.user as { userId: string };

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
}
