import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AnalyticsEvent, AnalyticsAction } from '../interfaces/analytics-event.interface';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update user analytics based on user action
   */
  async updateUserAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      const actionData = {
        productId: event.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: event.timestamp,
        country: event.country,
        city: event.city,
        device: event.device,
      };

      // Calculate increments based on action type
      const increments = this.calculateUserIncrements(event.action);

      await this.prisma.userAnalytics.upsert({
        where: { userId: event.userId },
        create: {
          userId: event.userId,
          lastVisited: event.timestamp,
          actions: [actionData],
          totalViews: increments.totalViews,
          totalCartAdds: increments.totalCartAdds,
          totalWishlist: increments.totalWishlist,
          totalPurchases: increments.totalPurchases,
          country: event.country,
          city: event.city,
          device: event.device,
        },
        update: {
          lastVisited: event.timestamp,
          actions: {
            push: actionData,
          },
          totalViews: { increment: increments.totalViews },
          totalCartAdds: { increment: increments.totalCartAdds },
          totalWishlist: { increment: increments.totalWishlist },
          totalPurchases: { increment: increments.totalPurchases },
          // Update location and device with latest info
          ...(event.country && { country: event.country }),
          ...(event.city && { city: event.city }),
          ...(event.device && { device: event.device }),
        },
      });

      this.logger.log(`Updated user analytics for user ${event.userId} - action: ${event.action}`);
    } catch (error) {
      this.logger.error(
        `Failed to update user analytics for user ${event.userId}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Update product analytics based on user action
   */
  async updateProductAnalytics(event: AnalyticsEvent): Promise<void> {
    // Product analytics only applies to product-related actions
    if (!event.productId) {
      return;
    }

    try {
      const increments = this.calculateProductIncrements(event.action);
      const now = event.timestamp;

      await this.prisma.productAnalytics.upsert({
        where: { productId: event.productId },
        create: {
          productId: event.productId,
          shopId: event.shopId,
          views: increments.views,
          uniqueViews: increments.uniqueViews,
          cartAdds: increments.cartAdds,
          wishlistAdds: increments.wishlistAdds,
          wishlistRemoves: increments.wishlistRemoves,
          purchases: increments.purchases,
          lastViewAt: event.action === 'product_view' ? now : undefined,
          lastCartAddAt: event.action === 'add_to_cart' ? now : undefined,
          lastPurchaseAt: event.action === 'purchase' ? now : undefined,
        },
        update: {
          views: { increment: increments.views },
          uniqueViews: { increment: increments.uniqueViews },
          cartAdds: { increment: increments.cartAdds },
          wishlistAdds: { increment: increments.wishlistAdds },
          wishlistRemoves: { increment: increments.wishlistRemoves },
          purchases: { increment: increments.purchases },
          ...(event.action === 'product_view' && { lastViewAt: now }),
          ...(event.action === 'add_to_cart' && { lastCartAddAt: now }),
          ...(event.action === 'purchase' && { lastPurchaseAt: now }),
        },
      });

      // Update conversion rates
      await this.updateConversionRates(event.productId);

      this.logger.log(`Updated product analytics for product ${event.productId} - action: ${event.action}`);
    } catch (error) {
      this.logger.error(
        `Failed to update product analytics for product ${event.productId}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Update shop analytics based on user action
   */
  async updateShopAnalytics(event: AnalyticsEvent): Promise<void> {
    if (!event.shopId) {
      return;
    }

    try {
      const now = event.timestamp;

      await this.prisma.shopAnalytics.upsert({
        where: { shopId: event.shopId },
        create: {
          shopId: event.shopId,
          visits: event.action === 'shop_visit' ? 1 : 0,
          uniqueVisitors: 1,
          totalProductViews: event.action === 'product_view' ? 1 : 0,
          totalCartAdds: event.action === 'add_to_cart' ? 1 : 0,
          totalWishlistAdds: event.action === 'add_to_wishlist' ? 1 : 0,
          totalPurchases: event.action === 'purchase' ? 1 : 0,
          lastVisitAt: now,
        },
        update: {
          ...(event.action === 'shop_visit' && { visits: { increment: 1 } }),
          ...(event.action === 'product_view' && { totalProductViews: { increment: 1 } }),
          ...(event.action === 'add_to_cart' && { totalCartAdds: { increment: 1 } }),
          ...(event.action === 'add_to_wishlist' && { totalWishlistAdds: { increment: 1 } }),
          ...(event.action === 'purchase' && { totalPurchases: { increment: 1 } }),
          lastVisitAt: now,
        },
      });

      this.logger.log(`Updated shop analytics for shop ${event.shopId} - action: ${event.action}`);
    } catch (error) {
      this.logger.error(
        `Failed to update shop analytics for shop ${event.shopId}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Calculate increments for user analytics based on action
   */
  private calculateUserIncrements(action: AnalyticsAction): {
    totalViews: number;
    totalCartAdds: number;
    totalWishlist: number;
    totalPurchases: number;
  } {
    return {
      totalViews: action === 'product_view' ? 1 : 0,
      totalCartAdds: action === 'add_to_cart' ? 1 : 0,
      totalWishlist:
        action === 'add_to_wishlist'
          ? 1
          : action === 'remove_from_wishlist'
          ? -1
          : 0,
      totalPurchases: action === 'purchase' ? 1 : 0,
    };
  }

  /**
   * Calculate increments for product analytics based on action
   */
  private calculateProductIncrements(action: AnalyticsAction): {
    views: number;
    uniqueViews: number;
    cartAdds: number;
    wishlistAdds: number;
    wishlistRemoves: number;
    purchases: number;
  } {
    return {
      views: action === 'product_view' ? 1 : 0,
      uniqueViews: action === 'product_view' ? 1 : 0, // TODO: Track unique views properly
      cartAdds: action === 'add_to_cart' ? 1 : 0,
      wishlistAdds: action === 'add_to_wishlist' ? 1 : 0,
      wishlistRemoves: action === 'remove_from_wishlist' ? 1 : 0,
      purchases: action === 'purchase' ? 1 : 0,
    };
  }

  /**
   * Update conversion rates for a product
   */
  private async updateConversionRates(productId: string): Promise<void> {
    try {
      const analytics = await this.prisma.productAnalytics.findUnique({
        where: { productId },
      });

      if (!analytics) {
        return;
      }

      const viewToCartRate =
        analytics.views > 0 ? (analytics.cartAdds / analytics.views) * 100 : 0;
      const viewToWishlistRate =
        analytics.views > 0
          ? (analytics.wishlistAdds / analytics.views) * 100
          : 0;
      const cartToPurchaseRate =
        analytics.cartAdds > 0
          ? (analytics.purchases / analytics.cartAdds) * 100
          : 0;

      await this.prisma.productAnalytics.update({
        where: { productId },
        data: {
          viewToCartRate: Number(viewToCartRate.toFixed(2)),
          viewToWishlistRate: Number(viewToWishlistRate.toFixed(2)),
          cartToPurchaseRate: Number(cartToPurchaseRate.toFixed(2)),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to update conversion rates for product ${productId}`,
        error instanceof Error ? error.message : undefined
      );
      // Don't throw - this is a non-critical operation
    }
  }
}
