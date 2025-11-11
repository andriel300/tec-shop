import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from '../services/analytics.service';
import type {
  AnalyticsEvent,
  KafkaEventPayload,
} from '../interfaces/analytics-event.interface';

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);
  private readonly eventQueue: AnalyticsEvent[] = [];
  private readonly BATCH_INTERVAL_MS = 3000; // Process batch every 3 seconds
  private readonly BATCH_SIZE = 100; // Process max 100 events per batch

  // Valid action types
  private readonly validActions = new Set([
    'add_to_wishlist',
    'add_to_cart',
    'product_view',
    'remove_from_wishlist',
    'shop_visit',
    'remove_from_cart',
    'purchase',
  ]);

  constructor(private readonly analyticsService: AnalyticsService) {
    // Start batch processing interval
    setInterval(() => this.processQueue(), this.BATCH_INTERVAL_MS);
    this.logger.log(
      `Batch processing started (interval: ${this.BATCH_INTERVAL_MS}ms)`
    );
  }

  /**
   * Process queued events in batches
   */
  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    // Take up to BATCH_SIZE events from the queue
    const batch = this.eventQueue.splice(0, this.BATCH_SIZE);
    this.logger.log(`Processing batch of ${batch.length} events`);

    let successCount = 0;
    let failureCount = 0;

    for (const event of batch) {
      try {
        // Validate action type
        if (!this.validActions.has(event.action)) {
          this.logger.warn(`Invalid action type: ${event.action}`);
          continue;
        }

        // Process analytics in parallel
        await Promise.all([
          this.analyticsService.updateUserAnalytics(event),
          this.analyticsService.updateProductAnalytics(event),
          this.analyticsService.updateShopAnalytics(event),
        ]);

        successCount++;
      } catch (error) {
        failureCount++;
        this.logger.error(
          `Failed to process event for user ${event.userId}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }

    this.logger.log(
      `Batch processed: ${successCount} success, ${failureCount} failed`
    );
  }

  /**
   * Handle incoming Kafka messages from users-event topic
   */
  @EventPattern('users-event')
  async handleUserEvent(@Payload() payload: KafkaEventPayload): Promise<void> {
    try {
      // Validate required fields
      if (!payload.userId || !payload.action) {
        this.logger.warn('Invalid event payload: missing userId or action');
        return;
      }

      // Transform payload to AnalyticsEvent
      const event: AnalyticsEvent = {
        userId: payload.userId,
        productId: payload.productId,
        shopId: payload.shopId,
        action: payload.action as AnalyticsEvent['action'],
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        country: payload.country,
        city: payload.city,
        device: payload.device,
      };

      // Add to queue
      this.eventQueue.push(event);
      this.logger.debug(
        `Event queued: ${event.action} by user ${event.userId} (queue size: ${this.eventQueue.length})`
      );
    } catch (error) {
      this.logger.error(
        'Failed to process Kafka message',
        error instanceof Error ? error.stack : undefined
      );
    }
  }
}
