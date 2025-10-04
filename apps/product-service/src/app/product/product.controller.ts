import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ProductService } from './product.service';
import type { CreateProductDto, UpdateProductDto } from '@tec-shop/dto';

// Multer configuration for local file storage
const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/products';

      // Create directory if it doesn't exist
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-random-originalname
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      const name = file.originalname.replace(ext, '').replace(/\s+/g, '-');
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Only allow images
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

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new product with image upload
   * Handles multipart/form-data with files
   */
  @MessagePattern('seller-create-product')
  async create(
    @Payload() payload: {
      sellerId: string;
      productData: CreateProductDto;
      files?: Express.Multer.File[];
    }
  ) {
    const { sellerId, productData, files } = payload;

    // Extract file paths from uploaded files
    const imagePaths = files?.map((file) => `/uploads/products/${file.filename}`) || [];

    // Validate at least one image
    if (imagePaths.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    return this.productService.create(sellerId, productData, imagePaths);
  }

  /**
   * Get all products for a shop
   */
  @MessagePattern('seller-get-products')
  async findAll(@Payload() payload: {
    shopId: string;
    filters?: {
      category?: string;
      isActive?: boolean;
      isFeatured?: boolean;
    };
  }) {
    return this.productService.findAll(payload.shopId, payload.filters);
  }

  /**
   * Get single product by ID
   */
  @MessagePattern('seller-get-product')
  async findOne(@Payload() payload: { id: string; sellerId: string }) {
    return this.productService.findOne(payload.id, payload.sellerId);
  }

  /**
   * Update product with optional new images
   */
  @MessagePattern('seller-update-product')
  async update(
    @Payload() payload: {
      id: string;
      sellerId: string;
      productData: UpdateProductDto;
      files?: Express.Multer.File[];
    }
  ) {
    const { id, sellerId, productData, files } = payload;

    // Extract new file paths if provided
    const newImagePaths = files?.map((file) => `/uploads/products/${file.filename}`);

    return this.productService.update(id, sellerId, productData, newImagePaths);
  }

  /**
   * Delete product
   */
  @MessagePattern('seller-delete-product')
  async remove(@Payload() payload: { id: string; sellerId: string }) {
    return this.productService.remove(payload.id, payload.sellerId);
  }

  /**
   * Increment product views
   */
  @MessagePattern('seller-increment-product-views')
  async incrementViews(@Payload() payload: { id: string }) {
    return this.productService.incrementViews(payload.id);
  }
}
