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
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import * as Dto from '@tec-shop/dto';
import * as multer from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Multer configuration for local file storage
const multerConfig = {
  storage: multer.diskStorage({
    destination: (
      _req: Express.Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) => {
      const uploadPath = './uploads/products';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      const name = file.originalname.replace(ext, '').replace(/\s+/g, '-');
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void
  ) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 4, // Max 4 images
  },
};

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(@Inject('PRODUCT_SERVICE') private productService: ClientProxy) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product with images (seller only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FilesInterceptor('images', 4, multerConfig))
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid product data or missing images.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required.' })
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

    return firstValueFrom(
      this.productService.send('product-create-product', {
        sellerId: user.userId,
        productData,
        files,
      })
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for seller shop (seller only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required.' })
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
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required.' })
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
  @ApiOperation({ summary: 'Update a product with optional new images (seller only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FilesInterceptor('images', 4, multerConfig))
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required.' })
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

    return firstValueFrom(
      this.productService.send('product-update-product', {
        id,
        sellerId: user.userId,
        productData,
        files,
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
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required.' })
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
