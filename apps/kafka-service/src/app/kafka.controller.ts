import { Controller, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventPattern, Payload, ClientProxy } from '@nestjs/microservices';
import { AnalyticsService } from '../services/analytics.service';
import type {
  AnalyticsEvent,
  KafkaEventPayload,
} from '../interfaces/analytics-event.interface';

const DLQ_TOPIC = 'users-event.DLQ';
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

@Controller()
export class KafkaController implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaController.name);
  private readonly eventQueue: AnalyticsEvent[] = [];
  private readonly BATCH_INTERVAL_MS = 3000;
  private readonly BATCH_SIZE = 100;
  private batchInterval: NodeJS.Timeout | undefined;

  private readonly validActions = new Set([
    'add_to_wishlist',
    'add_to_cart',
    'product_view',
    'remove_from_wishlist',
    'shop_visit',
    'remove_from_cart',
    'purchase',
  ]);

  constructor(
    private readonly analyticsService: AnalyticsService,
    @Inject('KAFKA_DLQ_CLIENT') private readonly dlqClient: ClientProxy
  ) {}

  onModuleInit() {
    this.batchInterval = setInterval(
      () => void this.processQueue(),
      this.BATCH_INTERVAL_MS
    );
    this.logger.log(
      `Batch processing started (interval: ${this.BATCH_INTERVAL_MS}ms)`
    );
  }

  onModuleDestroy() {
    if (this.batchInterval) clearInterval(this.batchInterval);
  }

  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.BATCH_SIZE);
    this.logger.log(`Processing batch of ${batch.length} events`);

    let successCount = 0;
    let failureCount = 0;

    for (const event of batch) {
      if (!this.validActions.has(event.action)) {
        this.logger.warn(`Invalid action type: ${event.action}`);
        continue;
      }

      try {
        await this.withRetry(() =>
          Promise.all([
            this.analyticsService.updateUserAnalytics(event),
            this.analyticsService.updateProductAnalytics(event),
            this.analyticsService.updateShopAnalytics(event),
          ])
        );
        successCount++;
      } catch (error) {
        failureCount++;
        this.logger.error(
          `All retries exhausted for user ${event.userId} — sending to DLQ`,
          error instanceof Error ? error.stack : undefined
        );
        this.dlqClient.emit(DLQ_TOPIC, {
          originalTopic: 'users-event',
          payload: event,
          errorMessage: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString(),
        });
      }
    }

    this.logger.log(
      `Batch processed: ${successCount} success, ${failureCount} sent to DLQ`
    );
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, BASE_DELAY_MS * attempt));
        }
      }
    }
    throw lastError;
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
