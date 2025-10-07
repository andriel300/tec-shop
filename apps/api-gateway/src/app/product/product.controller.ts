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
} from '@nestjs/common';
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
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import * as Dto from '@tec-shop/dto';
import { ImageKitService } from '@tec-shop/shared/imagekit';

// File validation configuration
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 4;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
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
}
