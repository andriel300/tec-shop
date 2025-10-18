import { Controller, BadRequestException, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';
import type { CreateProductDto, UpdateProductDto } from '@tec-shop/dto';

@Controller()
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

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
      shopId: string;
      productData: CreateProductDto;
      imageUrls?: string[];
    }
  ) {
    try {
      this.logger.log(
        `Received product creation request - sellerId: ${payload.sellerId}, shopId: ${payload.shopId}, images: ${payload.imageUrls?.length || 0}`
      );
      this.logger.debug(
        `Product data: ${JSON.stringify({
          name: payload.productData?.name,
          categoryId: payload.productData?.categoryId,
          brandId: payload.productData?.brandId,
          price: payload.productData?.price,
          hasVariants: payload.productData?.hasVariants,
          variantsCount: payload.productData?.variants?.length || 0,
        })}`
      );

      const { sellerId, shopId, productData, imageUrls } = payload;

      // Validate at least one image URL
      if (!imageUrls || imageUrls.length === 0) {
        this.logger.error('Product creation failed: No image URLs provided');
        throw new BadRequestException('At least one product image is required');
      }

      // Add shopId to product data for service
      const productDataWithShop = {
        ...productData,
        shopId,
      };

      this.logger.debug(
        `Calling product service create method with shopId: ${shopId}`
      );

      const result = await this.productService.create(
        sellerId,
        productDataWithShop,
        imageUrls
      );

      this.logger.log(
        `Product created successfully - productId: ${result.id}, name: ${result.name}`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Product creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
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
