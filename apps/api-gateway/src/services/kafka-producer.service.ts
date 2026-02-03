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
    // Validate required environment variable
    const kafkaBroker = process.env.KAFKA_BROKER || process.env.REDPANDA_BROKER;
    if (!kafkaBroker) {
      throw new Error('Missing required environment variable: KAFKA_BROKER');
    }

    // Check if this is a local broker (no SSL needed)
    const isLocalBroker =
      kafkaBroker.startsWith('localhost') ||
      kafkaBroker.startsWith('127.0.0.1') ||
      kafkaBroker.startsWith('kafka:');

    // Check if authentication credentials are provided (for production/cloud)
    const username = process.env.KAFKA_USERNAME || process.env.REDPANDA_USERNAME;
    const password = process.env.KAFKA_PASSWORD || process.env.REDPANDA_PASSWORD;
    const hasCredentials = !!(username && password);

    // Only use SSL/SASL if credentials provided AND not a local broker
    // Can be overridden with KAFKA_SSL=true/false
    const sslOverride = process.env.KAFKA_SSL;
    const useAuthentication =
      sslOverride === 'true' ||
      (hasCredentials && !isLocalBroker && sslOverride !== 'false');

    // Initialize Kafka client with conditional authentication
    const kafkaConfig: {
      clientId: string;
      brokers: string[];
      ssl?: boolean;
      sasl?: {
        mechanism: 'scram-sha-256';
        username: string;
        password: string;
      };
      connectionTimeout: number;
      requestTimeout: number;
    } = {
      clientId: 'api-gateway-producer',
      brokers: [kafkaBroker],
      connectionTimeout: 10000,
      requestTimeout: 30000,
    };

    if (useAuthentication && hasCredentials) {
      kafkaConfig.ssl = true;
      kafkaConfig.sasl = {
        mechanism: 'scram-sha-256',
        username: username as string,
        password: password as string,
      };
      this.logger.log('Kafka authentication enabled (SCRAM-SHA-256 + SSL)');
    } else {
      this.logger.log(
        `Kafka authentication disabled (broker: ${kafkaBroker}, local: ${isLocalBroker})`
      );
    }

    this.kafka = new Kafka(kafkaConfig);
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
