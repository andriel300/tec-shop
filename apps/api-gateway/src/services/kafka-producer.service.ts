import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { buildKafkaConfig } from '@tec-shop/kafka-events';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka(
      buildKafkaConfig('api-gateway-producer', {
        connectionTimeout: 10000,
        requestTimeout: 30000,
      })
    );
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error(
        'Failed to connect Kafka producer',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(
        'Error disconnecting Kafka producer',
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * Send analytics event to Kafka
   */
  async sendAnalyticsEvent(event: {
    userId: string;
    productId?: string;
    shopId?: string;
    action: string;
    country?: string;
    city?: string;
    device?: string;
  }): Promise<void> {
    try {
      await this.producer.send({
        topic: 'users-event',
        messages: [
          {
            key: event.userId, // Use userId as key for partitioning
            value: JSON.stringify({
              ...event,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      this.logger.debug(
        `Sent analytics event: ${event.action} for user ${event.userId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send analytics event: ${event.action}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Send multiple analytics events in batch
   */
  async sendAnalyticsEventsBatch(
    events: Array<{
      userId: string;
      productId?: string;
      shopId?: string;
      action: string;
      country?: string;
      city?: string;
      device?: string;
    }>
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: 'users-event',
        messages: events.map((event) => ({
          key: event.userId,
          value: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
          }),
        })),
      });

      this.logger.debug(`Sent ${events.length} analytics events in batch`);
    } catch (error) {
      this.logger.error(
        'Failed to send analytics events batch',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
