import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { LogCategory } from '@tec-shop/dto';
import type { CreateRatingDto, UpdateRatingDto } from '@tec-shop/dto';
import { ProductPrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from '@tec-shop/product-client';
import { SellerServiceClient } from '../../clients/seller.client';
import { LogProducerService } from '@tec-shop/logger-producer';
import { NotificationProducerService } from '@tec-shop/notification-producer';

@Injectable()
export class ProductRatingService {
  private readonly logger = new Logger(ProductRatingService.name);

  constructor(
    private readonly prisma: ProductPrismaService,
    private readonly sellerClient: SellerServiceClient,
    private readonly logProducer: LogProducerService,
    private readonly notificationProducer: NotificationProducerService,
  ) {}

  async createRating(
    productId: string,
    userId: string,
    createRatingDto: CreateRatingDto,
    reviewData?: {
      title?: string;
      content?: string;
      images?: string[];
      reviewerName?: string;
      reviewerAvatar?: string;
    }
  ) {
    this.logger.log(
      `Creating rating for product ${productId} by user ${userId} with ${createRatingDto.rating} stars`
    );

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      this.logger.error(`Product not found: ${productId}`);
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      this.logger.error(`Cannot rate unpublished product: ${productId}`);
      throw new BadRequestException('Cannot rate unpublished products');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const rating = await tx.productRating.upsert({
          where: {
            productId_userId: {
              productId,
              userId,
            },
          },
          create: {
            productId,
            userId,
            rating: createRatingDto.rating,
            title: reviewData?.title,
            content: reviewData?.content,
            images: reviewData?.images ?? [],
            reviewerName: reviewData?.reviewerName,
            reviewerAvatar: reviewData?.reviewerAvatar,
          },
          update: {
            rating: createRatingDto.rating,
            title: reviewData?.title,
            content: reviewData?.content,
            images: reviewData?.images ?? [],
            reviewerName: reviewData?.reviewerName,
            reviewerAvatar: reviewData?.reviewerAvatar,
          },
        });

        const aggregates = await tx.productRating.aggregate({
          where: { productId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.product.update({
          where: { id: productId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            ratingCount: aggregates._count.rating || 0,
          },
        });

        return rating;
      });

      this.logger.log(
        `Rating created/updated successfully - ratingId: ${result.id}`
      );
      this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product rating created', {
        userId,
        metadata: { action: 'create_rating', productId, rating: createRatingDto.rating },
      });

      // Send notification to seller when review has content
      if (reviewData?.content) {
        try {
          const shopInfo = await this.sellerClient.getShop(product.shopId);
          const seller = shopInfo?.seller as Record<string, unknown> | undefined;
          const sellerAuthId = seller?.authId as string | undefined;
          if (sellerAuthId) {
            await this.notificationProducer.notifySeller(
              sellerAuthId,
              'product.new_rating',
              {
                productName: product.name,
                rating: String(createRatingDto.rating),
                reviewerName: reviewData?.reviewerName || 'A customer',
              },
              { productId, ratingId: result.id, productSlug: product.slug }
            );
          }
        } catch (notifError) {
          this.logger.warn(
            `Failed to send review notification: ${notifError instanceof Error ? notifError.message : 'Unknown error'}`
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create rating: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async updateRating(
    ratingId: string,
    userId: string,
    updateRatingDto: UpdateRatingDto
  ) {
    this.logger.log(`Updating rating ${ratingId} by user ${userId}`);

    const existingRating = await this.prisma.productRating.findUnique({
      where: { id: ratingId },
    });

    if (!existingRating) {
      this.logger.error(`Rating not found: ${ratingId}`);
      throw new NotFoundException('Rating not found');
    }

    if (existingRating.userId !== userId) {
      this.logger.error(
        `User ${userId} attempted to update rating ${ratingId} owned by ${existingRating.userId}`
      );
      throw new ForbiddenException('You can only update your own ratings');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedRating = await tx.productRating.update({
          where: { id: ratingId },
          data: { rating: updateRatingDto.rating },
        });

        const aggregates = await tx.productRating.aggregate({
          where: { productId: existingRating.productId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.product.update({
          where: { id: existingRating.productId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            ratingCount: aggregates._count.rating || 0,
          },
        });

        return updatedRating;
      });

      this.logger.log(`Rating updated successfully - ratingId: ${result.id}`);
      this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product rating updated', {
        userId,
        metadata: { action: 'update_rating', ratingId, productId: existingRating.productId, rating: updateRatingDto.rating },
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update rating: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async deleteRating(ratingId: string, userId: string) {
    this.logger.log(`Deleting rating ${ratingId} by user ${userId}`);

    const existingRating = await this.prisma.productRating.findUnique({
      where: { id: ratingId },
    });

    if (!existingRating) {
      this.logger.error(`Rating not found: ${ratingId}`);
      throw new NotFoundException('Rating not found');
    }

    if (existingRating.userId !== userId) {
      this.logger.error(
        `User ${userId} attempted to delete rating ${ratingId} owned by ${existingRating.userId}`
      );
      throw new ForbiddenException('You can only delete your own ratings');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.productRating.delete({
          where: { id: ratingId },
        });

        const aggregates = await tx.productRating.aggregate({
          where: { productId: existingRating.productId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.product.update({
          where: { id: existingRating.productId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            ratingCount: aggregates._count.rating || 0,
          },
        });
      });

      this.logger.log(`Rating deleted successfully - ratingId: ${ratingId}`);
      this.logProducer.info('product-service', LogCategory.PRODUCT, 'Product rating deleted', {
        userId,
        metadata: { action: 'delete_rating', ratingId, productId: existingRating.productId },
      });

      return { message: 'Rating deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete rating: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getUserRating(productId: string, userId: string) {
    this.logger.debug(
      `Getting rating for product ${productId} by user ${userId}`
    );

    const rating = await this.prisma.productRating.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    return rating;
  }

  async getProductReviews(
    productId: string,
    page = 1,
    limit = 10,
    sort: 'newest' | 'highest' | 'lowest' = 'newest'
  ) {
    this.logger.log(
      `Getting reviews for product ${productId} - page: ${page}, limit: ${limit}, sort: ${sort}`
    );

    const skip = (page - 1) * limit;

    const orderBy: Record<string, string> =
      sort === 'highest'
        ? { rating: 'desc' }
        : sort === 'lowest'
          ? { rating: 'asc' }
          : { createdAt: 'desc' };

    const [reviews, total, aggregates, distribution] = await Promise.all([
      this.prisma.productRating.findMany({
        where: { productId },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.productRating.count({
        where: { productId },
      }),
      this.prisma.productRating.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.productRating.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      }),
    ]);

    const ratingDistribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    distribution.forEach((group) => {
      ratingDistribution[String(group.rating)] = group._count.rating;
    });

    return {
      reviews,
      total,
      page,
      limit,
      averageRating: aggregates._avg.rating || 0,
      ratingCount: aggregates._count.rating || 0,
      ratingDistribution,
    };
  }

  async addSellerResponse(
    ratingId: string,
    sellerId: string,
    response: string
  ) {
    this.logger.log(`Seller ${sellerId} responding to rating ${ratingId}`);

    const rating = await this.prisma.productRating.findUnique({
      where: { id: ratingId },
      include: { product: true },
    });

    if (!rating) {
      throw new NotFoundException('Review not found');
    }

    const ownsShop = await this.sellerClient.verifyShopOwnership(
      sellerId,
      rating.product.shopId
    );

    if (!ownsShop) {
      throw new ForbiddenException(
        'You can only respond to reviews on your own products'
      );
    }

    const updatedRating = await this.prisma.productRating.update({
      where: { id: ratingId },
      data: {
        sellerResponse: response,
        sellerResponseAt: new Date(),
      },
    });

    this.logger.log(`Seller response added to rating ${ratingId}`);
    this.logProducer.info('product-service', LogCategory.PRODUCT, 'Seller responded to review', {
      userId: sellerId,
      metadata: { action: 'seller_response', ratingId, productId: rating.productId },
    });

    return updatedRating;
  }
}
