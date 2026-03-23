import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { NotificationEventDto } from '@tec-shop/dto';
import { KafkaService } from '../kafka/kafka.service';
import type { Consumer, EachMessagePayload } from 'kafkajs';

const TOPIC = 'notification-events';
const DLQ_TOPIC = 'notification-events.DLQ';
const GROUP_ID = 'notification-events-group';
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

@Injectable()
export class NotificationEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventConsumer.name);
  private kafkaConsumer: Consumer;

  constructor(
    private readonly kafka: KafkaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.kafkaConsumer = this.kafka.createConsumer(GROUP_ID);
  }

  async onModuleInit() {
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe({ topic: TOPIC, fromBeginning: false });
    this.logger.log('NotificationEventConsumer is running...');

    await this.kafkaConsumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const raw = payload.message.value?.toString();
        if (!raw) return;

        try {
          const dto: NotificationEventDto = JSON.parse(raw);
          this.logger.verbose(`Received: ${dto.templateId} -> ${dto.targetType}:${dto.targetId}`);
          await this.withRetry(() => this.dispatch(dto));
        } catch (error) {
          await this.sendToDlq(raw, error);
        }
      },
    });
  }

  private async dispatch(dto: NotificationEventDto): Promise<void> {
    // Fan out to all listeners: NotificationCoreService, ChannelService
    await this.eventEmitter.emitAsync('notification.received', dto);
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        this.logger.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err}`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, BASE_DELAY_MS * attempt));
        }
      }
    }
    throw lastError;
  }

  private async sendToDlq(raw: string, error: unknown): Promise<void> {
    this.logger.error(`All retries exhausted — sending to ${DLQ_TOPIC}: ${error}`);
    await this.kafka.sendMessage(DLQ_TOPIC, 'dlq', {
      originalTopic: TOPIC,
      payload: raw,
      errorMessage: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    });
  }
}
