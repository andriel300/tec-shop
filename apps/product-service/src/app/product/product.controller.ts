import { Controller, BadRequestException, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';
import type {
  CreateProductDto,
  UpdateProductDto,
  CreateRatingDto,
  UpdateRatingDto,
} from '@tec-shop/dto';

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
        `Received product creation request - sellerId: ${
          payload.sellerId
        }, shopId: ${payload.shopId}, images: ${payload.imageUrls?.length || 0}`
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
        `Product creation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Get multiple products by IDs (for recommendation enrichment)
   */
  @MessagePattern('product-get-by-ids')
  async findByIds(@Payload() data: { ids: string[] }) {
    return this.productService.findByIds(data.ids);
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
        search?: string;
      };
    }
  ) {
    this.logger.log(
      `Received product-get-products request - shopId: ${
        payload.shopId
      }, filters: ${JSON.stringify(payload.filters)}`
    );

    const products = await this.productService.findAll(
      payload.shopId,
      payload.filters
    );

    this.logger.log(
      `Returning ${products.length} products for shopId: ${payload.shopId}`
    );

    return products;
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
    try {
      this.logger.log(
        `Received product update request - productId: ${
          payload.id
        }, sellerId: ${payload.sellerId}, hasImages: ${!!payload.imageUrls}`
      );

      const { id, sellerId, productData, imageUrls } = payload;

      const result = await this.productService.update(
        id,
        sellerId,
        productData,
        imageUrls
      );

      this.logger.log(`Product updated successfully - productId: ${result.id}`);

      return result;
    } catch (error) {
      this.logger.error(
        `Product update failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Delete product
   */
  @MessagePattern('product-delete-product')
  async remove(@Payload() payload: { id: string; sellerId: string }) {
    return this.productService.remove(payload.id, payload.sellerId);
  }

  /**
   * Get deleted products (trash)
   */
  @MessagePattern('product-get-deleted-products')
  async findDeleted(
    @Payload()
    payload: {
      shopId: string;
      filters?: {
        categoryId?: string;
        brandId?: string;
        search?: string;
      };
    }
  ) {
    this.logger.log(
      `Received product-get-deleted-products request - shopId: ${payload.shopId}`
    );

    const products = await this.productService.findDeleted(
      payload.shopId,
      payload.filters
    );

    this.logger.log(
      `Returning ${products.length} deleted products for shopId: ${payload.shopId}`
    );

    return products;
  }

  /**
   * Restore deleted product
   */
  @MessagePattern('product-restore-product')
  async restore(@Payload() payload: { id: string; sellerId: string }) {
    this.logger.log(
      `Received product-restore-product request - productId: ${payload.id}, sellerId: ${payload.sellerId}`
    );

    const result = await this.productService.restore(
      payload.id,
      payload.sellerId
    );

    this.logger.log(`Product restored successfully - productId: ${result.id}`);

    return result;
  }

  /**
   * Increment product views
   */
  @MessagePattern('product-increment-product-views')
  async incrementViews(@Payload() payload: { id: string }) {
    return this.productService.incrementViews(payload.id);
  }

  /**
   * Get all public products for marketplace frontend
   * Returns only published, public, active, non-deleted products
   * Supports comprehensive filtering, sorting, and pagination
   */
  @MessagePattern('product-get-public-products')
  async findPublicProducts(
    @Payload()
    payload: {
      categoryId?: string;
      brandId?: string;
      shopId?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      productType?: string;
      isFeatured?: boolean;
      tags?: string[];
      sort?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    this.logger.log(
      `Received product-get-public-products request with filters: ${JSON.stringify(
        {
          categoryId: payload.categoryId,
          brandId: payload.brandId,
          shopId: payload.shopId,
          search: payload.search,
          sort: payload.sort,
          limit: payload.limit,
          offset: payload.offset,
        }
      )}`
    );

    const result = await this.productService.findPublicProducts(payload);

    this.logger.log(
      `Returning ${result.products.length} products out of ${result.total} total (offset: ${result.offset}, limit: ${result.limit})`
    );

    return result;
  }

  /**
   * Get a single public product by slug
   * Public endpoint - returns only published, active products
   */
  @MessagePattern('product-get-by-slug')
  async findProductBySlug(@Payload() payload: { slug: string }) {
    this.logger.log(
      `Received product-get-by-slug request for slug: ${payload.slug}`
    );

    const product = await this.productService.findPublicProductBySlug(
      payload.slug
    );

    this.logger.log(`Returning product: ${product?.id || 'not found'}`);

    return { product };
  }

  /**
   * Create or update a product rating
   * Uses upsert pattern - creates new rating or updates existing one
   */
  @MessagePattern('product-create-rating')
  async createRating(
    @Payload()
    payload: {
      productId: string;
      userId: string;
      rating: CreateRatingDto;
    }
  ) {
    this.logger.log(
      `Received product-create-rating request - productId: ${payload.productId}, userId: ${payload.userId}, rating: ${payload.rating.rating}`
    );

    const result = await this.productService.createRating(
      payload.productId,
      payload.userId,
      payload.rating
    );

    this.logger.log(
      `Rating created/updated successfully - ratingId: ${result.id}, productId: ${payload.productId}`
    );

    return result;
  }

  /**
   * Update an existing product rating
   */
  @MessagePattern('product-update-rating')
  async updateRating(
    @Payload()
    payload: {
      ratingId: string;
      userId: string;
      rating: UpdateRatingDto;
    }
  ) {
    this.logger.log(
      `Received product-update-rating request - ratingId: ${payload.ratingId}, userId: ${payload.userId}, rating: ${payload.rating.rating}`
    );

    const result = await this.productService.updateRating(
      payload.ratingId,
      payload.userId,
      payload.rating
    );

    this.logger.log(`Rating updated successfully - ratingId: ${result.id}`);

    return result;
  }

  /**
   * Delete a product rating
   */
  @MessagePattern('product-delete-rating')
  async deleteRating(
    @Payload()
    payload: {
      ratingId: string;
      userId: string;
    }
  ) {
    this.logger.log(
      `Received product-delete-rating request - ratingId: ${payload.ratingId}, userId: ${payload.userId}`
    );

    const result = await this.productService.deleteRating(
      payload.ratingId,
      payload.userId
    );

    this.logger.log(
      `Rating deleted successfully - ratingId: ${payload.ratingId}`
    );

    return result;
  }

  /**
   * Get a user's rating for a specific product
   */
  @MessagePattern('product-get-user-rating')
  async getUserRating(
    @Payload()
    payload: {
      productId: string;
      userId: string;
    }
  ) {
    this.logger.log(
      `Received product-get-user-rating request - productId: ${payload.productId}, userId: ${payload.userId}`
    );

    const result = await this.productService.getUserRating(
      payload.productId,
      payload.userId
    );

    this.logger.log(
      `Returning user rating - productId: ${
        payload.productId
      }, hasRating: ${!!result}`
    );

    return result;
  }

  /**
   * Get available filter options (colors, sizes) from active product variants
   * Used for dynamically populating filter options in the frontend
   */
  @MessagePattern('product-get-available-filters')
  async getAvailableFilters() {
    this.logger.log('Received product-get-available-filters request');

    const result = await this.productService.getAvailableFilters();

    this.logger.log(
      `Returning available filters - colors: ${result.colors.length}, sizes: ${result.sizes.length}`
    );

    return result;
  }
}
