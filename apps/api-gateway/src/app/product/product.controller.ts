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
import { CreateProductDto, UpdateProductDto } from '@tec-shop/dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Multer configuration for local file storage
const multerConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const uploadPath = './uploads/products';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      const name = file.originalname.replace(ext, '').replace(/\s+/g, '-');
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
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
  @ApiOperation({ summary: 'Create a new product with images' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 4, multerConfig))
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid product data or missing images.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createProduct(
    @Req() req: Record<string, unknown>,
    @Body() productData: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const user = req.user as { id: string; email: string };

    return firstValueFrom(
      this.productService.send('product-create-product', {
        sellerId: user.id,
        productData,
        files,
      })
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for seller shop' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
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
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async getProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string
  ) {
    const user = req.user as { id: string; email: string };

    return firstValueFrom(
      this.productService.send('product-get-product', {
        id,
        sellerId: user.id,
      })
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product with optional new images' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 4, multerConfig))
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async updateProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string,
    @Body() productData: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const user = req.user as { id: string; email: string };

    return firstValueFrom(
      this.productService.send('product-update-product', {
        id,
        sellerId: user.id,
        productData,
        files,
      })
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async deleteProduct(
    @Req() req: Record<string, unknown>,
    @Param('id') id: string
  ) {
    const user = req.user as { id: string; email: string };

    return firstValueFrom(
      this.productService.send('product-delete-product', {
        id,
        sellerId: user.id,
      })
    );
  }
}
