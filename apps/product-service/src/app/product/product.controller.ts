import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ProductCatalogService } from './product-catalog.service';
import { ProductBrowseService } from './product-browse.service';
import { ProductRatingService } from './product-rating.service';
import type {
  CreateProductDto,
  UpdateProductDto,
  CreateRatingDto,
  UpdateRatingDto,
} from '@tec-shop/dto';

@Controller()
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly catalogService: ProductCatalogService,
    private readonly browseService: ProductBrowseService,
    private readonly ratingService: ProductRatingService,
  ) {}

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

      if (!imageUrls || imageUrls.length === 0) {
        this.logger.error('Product creation failed: No image URLs provided');
        throw new RpcException({ statusCode: 400, message: 'At least one product image is required' });
      }

      const productDataWithShop = {
        ...productData,
        shopId,
      };

      this.logger.debug(
        `Calling product catalog service create method with shopId: ${shopId}`
      );

      const result = await this.catalogService.create(
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

  @MessagePattern('product-get-by-ids')
  async findByIds(@Payload() data: { ids: string[] }) {
    return this.catalogService.findByIds(data.ids);
  }

  @MessagePattern('product-get-products')
  async findAll(
    @Payload()
    payload: {
      shopId: string;
      sellerId?: string;
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

    const products = await this.catalogService.findAll(
      payload.shopId,
      payload.filters,
      payload.sellerId
    );

    this.logger.log(
      `Returning ${products.length} products for shopId: ${payload.shopId}`
    );

    return products;
  }

  @MessagePattern('product-get-product')
  async findOne(@Payload() payload: { id: string; sellerId: string }) {
    return this.catalogService.findOne(payload.id, payload.sellerId);
  }

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

      const result = await this.catalogService.update(
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

  @MessagePattern('product-delete-product')
  async remove(@Payload() payload: { id: string; sellerId: string }) {
    return this.catalogService.remove(payload.id, payload.sellerId);
  }

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

    const products = await this.catalogService.findDeleted(
      payload.shopId,
      payload.filters
    );

    this.logger.log(
      `Returning ${products.length} deleted products for shopId: ${payload.shopId}`
    );

    return products;
  }

  @MessagePattern('product-restore-product')
  async restore(@Payload() payload: { id: string; sellerId: string }) {
    this.logger.log(
      `Received product-restore-product request - productId: ${payload.id}, sellerId: ${payload.sellerId}`
    );

    const result = await this.catalogService.restore(
      payload.id,
      payload.sellerId
    );

    this.logger.log(`Product restored successfully - productId: ${result.id}`);

    return result;
  }

  @MessagePattern('product-get-seller-stats')
  async getSellerProductStats(@Payload() payload: { shopId: string }) {
    return this.catalogService.getSellerProductStats(payload.shopId);
  }

  @MessagePattern('product-increment-product-views')
  async incrementViews(@Payload() payload: { id: string }) {
    return this.catalogService.incrementViews(payload.id);
  }

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

    const result = await this.browseService.findPublicProducts(payload);

    this.logger.log(
      `Returning ${result.products.length} products out of ${result.total} total (offset: ${result.offset}, limit: ${result.limit})`
    );

    return result;
  }

  @MessagePattern('product-get-by-slug')
  async findProductBySlug(@Payload() payload: { slug: string }) {
    this.logger.log(
      `Received product-get-by-slug request for slug: ${payload.slug}`
    );

    const product = await this.browseService.findPublicProductBySlug(
      payload.slug
    );

    this.logger.log(`Returning product: ${product?.id || 'not found'}`);

    return { product };
  }

  @MessagePattern('product-create-rating')
  async createRating(
    @Payload()
    payload: {
      productId: string;
      userId: string;
      rating: CreateRatingDto;
      reviewData?: {
        title?: string;
        content?: string;
        images?: string[];
        reviewerName?: string;
        reviewerAvatar?: string;
      };
    }
  ) {
    this.logger.log(
      `Received product-create-rating request - productId: ${payload.productId}, userId: ${payload.userId}, rating: ${payload.rating.rating}`
    );

    const result = await this.ratingService.createRating(
      payload.productId,
      payload.userId,
      payload.rating,
      payload.reviewData
    );

    this.logger.log(
      `Rating created/updated successfully - ratingId: ${result.id}, productId: ${payload.productId}`
    );

    return result;
  }

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

    const result = await this.ratingService.updateRating(
      payload.ratingId,
      payload.userId,
      payload.rating
    );

    this.logger.log(`Rating updated successfully - ratingId: ${result.id}`);

    return result;
  }

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

    const result = await this.ratingService.deleteRating(
      payload.ratingId,
      payload.userId
    );

    this.logger.log(
      `Rating deleted successfully - ratingId: ${payload.ratingId}`
    );

    return result;
  }

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

    const result = await this.ratingService.getUserRating(
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

  @MessagePattern('product-get-reviews')
  async getProductReviews(
    @Payload()
    payload: {
      productId: string;
      page?: number;
      limit?: number;
      sort?: 'newest' | 'highest' | 'lowest';
    }
  ) {
    this.logger.log(
      `Received product-get-reviews request - productId: ${payload.productId}, page: ${payload.page}, sort: ${payload.sort}`
    );

    const result = await this.ratingService.getProductReviews(
      payload.productId,
      payload.page,
      payload.limit,
      payload.sort
    );

    this.logger.log(
      `Returning ${result.reviews.length} reviews out of ${result.total} total for product ${payload.productId}`
    );

    return result;
  }

  @MessagePattern('product-add-seller-response')
  async addSellerResponse(
    @Payload()
    payload: {
      ratingId: string;
      sellerId: string;
      response: string;
    }
  ) {
    this.logger.log(
      `Received product-add-seller-response request - ratingId: ${payload.ratingId}, sellerId: ${payload.sellerId}`
    );

    const result = await this.ratingService.addSellerResponse(
      payload.ratingId,
      payload.sellerId,
      payload.response
    );

    this.logger.log(`Seller response added - ratingId: ${result.id}`);

    return result;
  }

  @MessagePattern('product-get-available-filters')
  async getAvailableFilters() {
    this.logger.log('Received product-get-available-filters request');

    const result = await this.browseService.getAvailableFilters();

    this.logger.log(
      `Returning available filters - colors: ${result.colors.length}, sizes: ${result.sizes.length}`
    );

    return result;
  }
}
