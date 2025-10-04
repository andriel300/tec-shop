import { Controller, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';
import type { CreateProductDto, UpdateProductDto } from '@tec-shop/dto';

// Type for file data received from API Gateway via TCP
interface FileData {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new product with image upload
   * Handles multipart/form-data with files
   */
  @MessagePattern('product-create-product')
  async create(
    @Payload()
    payload: {
      sellerId: string;
      productData: CreateProductDto;
      files?: FileData[];
    }
  ) {
    const { sellerId, productData, files } = payload;

    // Extract file paths from uploaded files
    const imagePaths =
      files?.map((file) => `/uploads/products/${file.filename}`) || [];

    // Validate at least one image
    if (imagePaths.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    return this.productService.create(sellerId, productData, imagePaths);
  }

  /**
   * Get all products for a shop
   */
  @MessagePattern('product-get-products')
  async findAll(
    @Payload()
    payload: {
      shopId: string;
      filters?: {
        category?: string;
        isActive?: boolean;
        isFeatured?: boolean;
      };
    }
  ) {
    return this.productService.findAll(payload.shopId, payload.filters);
  }

  /**
   * Get single product by ID
   */
  @MessagePattern('product-get-product')
  async findOne(@Payload() payload: { id: string; sellerId: string }) {
    return this.productService.findOne(payload.id, payload.sellerId);
  }

  /**
   * Update product with optional new images
   */
  @MessagePattern('product-update-product')
  async update(
    @Payload()
    payload: {
      id: string;
      sellerId: string;
      productData: UpdateProductDto;
      files?: FileData[];
    }
  ) {
    const { id, sellerId, productData, files } = payload;

    // Extract new file paths if provided
    const newImagePaths = files?.map(
      (file) => `/uploads/products/${file.filename}`
    );

    return this.productService.update(id, sellerId, productData, newImagePaths);
  }

  /**
   * Delete product
   */
  @MessagePattern('product-delete-product')
  async remove(@Payload() payload: { id: string; sellerId: string }) {
    return this.productService.remove(payload.id, payload.sellerId);
  }

  /**
   * Increment product views
   */
  @MessagePattern('product-increment-product-views')
  async incrementViews(@Payload() payload: { id: string }) {
    return this.productService.incrementViews(payload.id);
  }
}
