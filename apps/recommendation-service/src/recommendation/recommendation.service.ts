import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsPrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ModelService } from './ml/model.service';
import {
  ACTION_SCORES,
  type TrainingData,
  type IdMappings,
  type RecommendationResult,
} from './ml/model.types';

const CACHE_TTL_SECONDS = 3600; // 1 hour

interface UserAction {
  productId?: string;
  shopId?: string;
  action: string;
  timestamp: string;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prisma: AnalyticsPrismaService,
    private readonly modelService: ModelService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get personalized product recommendations for a user.
   * Falls back to popular products if model is not trained or user is unknown.
   * Results are cached in Redis for 1 hour.
   */
  async getRecommendations(
    userId: string,
    limit = 10
  ): Promise<RecommendationResult[]> {
    this.logger.log(`Getting recommendations for user ${userId}`);

    // Check Redis cache first
    const cacheKey = `rec:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for user ${userId}`);
      const parsed = JSON.parse(cached) as RecommendationResult[];
      return parsed.slice(0, limit);
    }

    // Try ML-based recommendations first
    const mlResults = this.modelService.predict(userId, limit);
    if (mlResults.length > 0) {
      await this.redisService.set(cacheKey, JSON.stringify(mlResults), CACHE_TTL_SECONDS);
      return mlResults;
    }

    // Fallback: return most popular products by views
    this.logger.debug(
      `No ML predictions for user ${userId}, falling back to popular products`
    );
    return this.getPopularProducts(limit);
  }

  /**
   * Fetch all user analytics data and train the collaborative filtering model.
   */
  async trainModel(): Promise<{ interactions: number; users: number; products: number }> {
    this.logger.log('Starting model training...');

    const allAnalytics = await this.prisma.userAnalytics.findMany({
      select: {
        userId: true,
        actions: true,
      },
    });

    // Build ID mappings
    const userIdToIndex = new Map<string, number>();
    const indexToUserId = new Map<number, string>();
    const productIdToIndex = new Map<string, number>();
    const indexToProductId = new Map<number, string>();

    const userIndices: number[] = [];
    const productIndices: number[] = [];
    const ratings: number[] = [];

    for (const analytics of allAnalytics) {
      const actions = analytics.actions as unknown as UserAction[];
      if (!Array.isArray(actions)) continue;

      // Assign user index
      if (!userIdToIndex.has(analytics.userId)) {
        const idx = userIdToIndex.size;
        userIdToIndex.set(analytics.userId, idx);
        indexToUserId.set(idx, analytics.userId);
      }
      const userIdx = userIdToIndex.get(analytics.userId)!;

      for (const action of actions) {
        if (!action.productId) continue;

        const score = ACTION_SCORES[action.action];
        if (score === undefined) continue;

        // Assign product index
        if (!productIdToIndex.has(action.productId)) {
          const idx = productIdToIndex.size;
          productIdToIndex.set(action.productId, idx);
          indexToProductId.set(idx, action.productId);
        }
        const productIdx = productIdToIndex.get(action.productId)!;

        userIndices.push(userIdx);
        productIndices.push(productIdx);
        ratings.push(score);
      }
    }

    if (userIndices.length === 0) {
      this.logger.warn('No interaction data found. Skipping training.');
      return { interactions: 0, users: 0, products: 0 };
    }

    const trainingData: TrainingData = {
      userIndices,
      productIndices,
      ratings,
      numUsers: userIdToIndex.size,
      numProducts: productIdToIndex.size,
    };

    const mappings: IdMappings = {
      userIdToIndex,
      indexToUserId,
      productIdToIndex,
      indexToProductId,
    };

    await this.modelService.train(trainingData, mappings);

    // Invalidate all cached recommendations after retraining
    await this.redisService.deleteByPattern('rec:*');
    this.logger.log('Cleared recommendation cache after training');

    const stats = {
      interactions: userIndices.length,
      users: userIdToIndex.size,
      products: productIdToIndex.size,
    };

    this.logger.log(
      `Training complete: ${stats.interactions} interactions, ${stats.users} users, ${stats.products} products`
    );

    return stats;
  }

  /**
   * Return the most popular products based on view count.
   */
  async getPopularProducts(
    limit: number
  ): Promise<RecommendationResult[]> {
    const popular = await this.prisma.productAnalytics.findMany({
      orderBy: { views: 'desc' },
      take: limit,
      select: {
        productId: true,
        views: true,
      },
    });

    return popular.map((p) => ({
      productId: p.productId,
      score: p.views,
    }));
  }

  /**
   * Get similar products based on same shop or general popularity.
   * Finds other products from the same shop, falling back to popular products.
   */
  async getSimilarProducts(
    productId: string,
    limit = 10
  ): Promise<RecommendationResult[]> {
    this.logger.log(`Getting similar products for ${productId}`);

    // Get the target product's analytics to find its shop
    const targetAnalytics = await this.prisma.productAnalytics.findUnique({
      where: { productId },
      select: { shopId: true },
    });

    if (!targetAnalytics?.shopId) {
      this.logger.debug(`No analytics for product ${productId}, falling back to popular`);
      return this.getPopularProducts(limit);
    }

    // Find other products from the same shop, sorted by engagement
    const similar = await this.prisma.productAnalytics.findMany({
      where: {
        productId: { not: productId },
        shopId: targetAnalytics.shopId,
      },
      orderBy: { views: 'desc' },
      take: limit,
      select: {
        productId: true,
        views: true,
      },
    });

    if (similar.length === 0) {
      return this.getPopularProducts(limit);
    }

    return similar.map((p) => ({
      productId: p.productId,
      score: p.views,
    }));
  }
}
