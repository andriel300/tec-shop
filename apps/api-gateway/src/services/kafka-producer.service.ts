import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = [
      'REDPANDA_BROKER',
      'REDPANDA_USERNAME',
      'REDPANDA_PASSWORD',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Initialize Kafka client
    this.kafka = new Kafka({
      clientId: 'api-gateway-producer',
      brokers: [process.env.REDPANDA_BROKER as string],
      ssl: true,
      sasl: {
        mechanism: 'scram-sha-256',
        username: process.env.REDPANDA_USERNAME as string,
        password: process.env.REDPANDA_PASSWORD as string,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected to Redpanda Cloud');
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
