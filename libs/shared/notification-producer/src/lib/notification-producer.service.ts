import { Injectable, Inject, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import type { NotificationEventDto, NotificationTargetType } from '@tec-shop/dto';
import { TemplateEngine } from './template.engine';

const NOTIFICATION_EVENTS_TOPIC = 'notification-events';

@Injectable()
export class NotificationProducerService {
  private readonly logger = new Logger(NotificationProducerService.name);
  private producer: Producer;
  private connected = false;
  private readonly templateEngine: TemplateEngine;

  constructor(
    @Inject('NOTIFICATION_PRODUCER_KAFKA')
    private readonly kafka: Kafka
  ) {
    this.producer = this.kafka.producer();
    this.templateEngine = new TemplateEngine();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log('NotificationProducer connected to Kafka');
      this.logger.log(
        `Loaded templates: ${this.templateEngine.getTemplateIds().join(', ')}`
      );
    } catch (error) {
      this.logger.error(
        'Failed to connect NotificationProducer to Kafka',
        error
      );
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.producer.disconnect();
      this.logger.log('NotificationProducer disconnected from Kafka');
    }
  }

  async notifyCustomer(
    userId: string,
    templateId: string,
    variables: Record<string, string>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.send('customer', userId, templateId, variables, metadata);
  }

  async notifySeller(
    authId: string,
    templateId: string,
    variables: Record<string, string>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.send('seller', authId, templateId, variables, metadata);
  }

  async notifyAdmin(
    templateId: string,
    variables: Record<string, string>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.send('admin', 'all', templateId, variables, metadata);
  }

  private async send(
    targetType: NotificationTargetType,
    targetId: string,
    templateId: string,
    variables: Record<string, string>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const rendered = this.templateEngine.render(templateId, variables);

    const event: NotificationEventDto = {
      targetType,
      targetId,
      templateId,
      title: rendered.title,
      message: rendered.message,
      type: rendered.type,
      metadata,
      timestamp: new Date().toISOString(),
    };

    await this.emit(event);
  }

  private async emit(event: NotificationEventDto): Promise<void> {
    if (!this.connected) {
      this.logger.warn(
        'NotificationProducer not connected, notification event dropped'
      );
      return;
    }

    try {
      await this.producer.send({
        topic: NOTIFICATION_EVENTS_TOPIC,
        messages: [
          {
            key: `${event.targetType}:${event.targetId}`,
            value: JSON.stringify(event),
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to emit notification event', error);
    }
  }
}
