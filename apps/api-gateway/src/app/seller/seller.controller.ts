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
  Req
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FilesInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import {
  CreateSellerProfileDto,
  CreateShopDto,
  UpdateShopDto,
  CreateProductDto,
  UpdateProductDto
} from '@tec-shop/dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

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
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },
};

@ApiTags('Seller')
@Controller('seller')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellerController {
  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy
  ) {}

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
  @ApiResponse({ status: 400, description: 'Shop already exists or invalid data.' })
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

  // ==================== Product Endpoints ====================

  @Post('products')
  @ApiOperation({ summary: 'Create a new product with images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid product data or missing images.' })
  @ApiResponse({ status: 403, description: 'Seller must create a shop first.' })
  @UseInterceptors(FilesInterceptor('images', 4, multerConfig))
  async createProduct(
    @Req() request: { user: { userId: string } },
    @Body() productData: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    // Get seller profile to retrieve sellerId
    const seller = await firstValueFrom(
      this.sellerService.send('get-seller-profile', request.user.userId)
    );

    return await firstValueFrom(
      this.sellerService.send('seller-create-product', {
        sellerId: seller.id,
        productData,
        files,
      })
    );
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products for seller shop' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully.',
  })
  async getProducts(
    @Req() request: { user: { userId: string } },
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string
  ) {
    // First get seller profile to get shopId
    const seller = await firstValueFrom(
      this.sellerService.send('get-seller-profile', request.user.userId)
    );

    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';

    return await firstValueFrom(
      this.sellerService.send('seller-get-products', {
        shopId: seller.shop?.id,
        filters,
      })
    );
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async getProduct(
    @Req() request: { user: { userId: string } },
    @Param('id') id: string
  ) {
    // Get seller profile to retrieve sellerId
    const seller = await firstValueFrom(
      this.sellerService.send('get-seller-profile', request.user.userId)
    );

    return await firstValueFrom(
      this.sellerService.send('seller-get-product', {
        id,
        sellerId: seller.id,
      })
    );
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update a product with optional new images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  @UseInterceptors(FilesInterceptor('images', 4, multerConfig))
  async updateProduct(
    @Req() request: { user: { userId: string } },
    @Param('id') id: string,
    @Body() productData: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    // Get seller profile to retrieve sellerId
    const seller = await firstValueFrom(
      this.sellerService.send('get-seller-profile', request.user.userId)
    );

    return await firstValueFrom(
      this.sellerService.send('seller-update-product', {
        id,
        sellerId: seller.id,
        productData,
        files,
      })
    );
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async deleteProduct(
    @Req() request: { user: { userId: string } },
    @Param('id') id: string
  ) {
    // Get seller profile to retrieve sellerId
    const seller = await firstValueFrom(
      this.sellerService.send('get-seller-profile', request.user.userId)
    );

    return await firstValueFrom(
      this.sellerService.send('seller-delete-product', {
        id,
        sellerId: seller.id,
      })
    );
  }
}