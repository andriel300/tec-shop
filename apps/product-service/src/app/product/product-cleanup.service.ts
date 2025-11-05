import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductPrismaService } from '../../prisma/prisma.service';

/**
 * Product Cleanup Service
 *
 * Handles scheduled tasks for product maintenance:
 * - Permanently deletes products that have been soft-deleted for more than 24 hours
 */
@Injectable()
export class ProductCleanupService {
  private readonly logger = new Logger(ProductCleanupService.name);

  constructor(private readonly prisma: ProductPrismaService) {}

  /**
   * Permanently delete products that have been soft-deleted for more than 24 hours
   * Runs every hour (at minute 0)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupDeletedProducts() {
    try {
      this.logger.log('Starting product cleanup task...');

      // Calculate the threshold date (24 hours ago)
      const threshold = new Date();
      threshold.setHours(threshold.getHours() - 24);

      this.logger.debug(`Looking for products deleted before: ${threshold.toISOString()}`);

      // Find products deleted more than 24 hours ago
      const productsToDelete = await this.prisma.product.findMany({
        where: {
          deletedAt: {
            lte: threshold, // Less than or equal to threshold
            not: null,      // Only soft-deleted products
          },
        },
        select: {
          id: true,
          name: true,
          deletedAt: true,
        },
      });

      if (productsToDelete.length === 0) {
        this.logger.log('No products to permanently delete');
        return;
      }

      this.logger.log(
        `Found ${productsToDelete.length} product(s) to permanently delete:`,
        productsToDelete.map((p) => ({
          id: p.id,
          name: p.name,
          deletedAt: p.deletedAt,
        }))
      );

      // Permanently delete products (variants will be cascade deleted)
      const result = await this.prisma.product.deleteMany({
        where: {
          id: {
            in: productsToDelete.map((p) => p.id),
          },
        },
      });

      this.logger.log(
        `Successfully permanently deleted ${result.count} product(s)`
      );
    } catch (error) {
      this.logger.error(
        'Failed to cleanup deleted products',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  /**
   * Manual trigger for cleanup (useful for testing)
   */
  async triggerCleanup() {
    this.logger.log('Manual cleanup triggered');
    await this.cleanupDeletedProducts();
  }
}
