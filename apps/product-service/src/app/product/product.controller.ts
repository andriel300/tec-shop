import { Controller, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';
import type { CreateProductDto, UpdateProductDto } from '@tec-shop/dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new product with ImageKit URLs
   * Receives image URLs from API Gateway after ImageKit upload
   */
  @MessagePattern('product-create-product')
  async create(
    @Payload()
    payload: {
      sellerId: string;
      productData: CreateProductDto;
      imageUrls?: string[];
    }
  ) {
    const { sellerId, productData, imageUrls } = payload;

    // Validate at least one image URL
    if (!imageUrls || imageUrls.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    return this.productService.create(sellerId, productData, imageUrls);
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
   * Update product with optional new ImageKit URLs
   */
  @MessagePattern('product-update-product')
  async update(
    @Payload()
    payload: {
      id: string;
      sellerId: string;
      productData: UpdateProductDto;
      imageUrls?: string[];
    }
  ) {
    const { id, sellerId, productData, imageUrls } = payload;

    return this.productService.update(id, sellerId, productData, imageUrls);
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
