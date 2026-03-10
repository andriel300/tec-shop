import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { LogEventDto } from '@tec-shop/dto';
import { KafkaService } from '../kafka/kafka.service';
import type { Consumer, EachMessagePayload } from 'kafkajs';
import { LoggerCoreService } from './logger-core.service';
import { LoggerGateway } from './logger.gateway';

const TOPIC = 'log-events';
const DLQ_TOPIC = 'log-events.DLQ';
const GROUP_ID = 'log-events-group';
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

@Injectable()
export class LogEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(LogEventConsumer.name);
  private kafkaConsumer: Consumer;

  constructor(
    private readonly kafka: KafkaService,
    private readonly loggerCore: LoggerCoreService,
    private readonly loggerGateway: LoggerGateway
  ) {
    this.kafkaConsumer = this.kafka.createConsumer(GROUP_ID);
  }

  async onModuleInit() {
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe({ topic: TOPIC, fromBeginning: false });
    this.logger.log('LogEventConsumer is running...');

    await this.kafkaConsumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const raw = payload.message.value?.toString();
        if (!raw) return;

        try {
          const data: LogEventDto = JSON.parse(raw);
          this.logger.verbose(
            `Received log event from ${data.service}: ${data.level} - ${data.message.substring(0, 50)}`
          );
          await this.withRetry(() => this.handleLogEvent(data));
        } catch (error) {
          await this.sendToDlq(raw, error);
        }
      },
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `Log event attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err}`
        );
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, BASE_DELAY_MS * attempt));
        }
      }
    }
    throw lastError;
  }

  private async sendToDlq(raw: string, error: unknown): Promise<void> {
    this.logger.error(
      `All retries exhausted — sending to ${DLQ_TOPIC}: ${error}`
    );
    await this.kafka.sendMessage(DLQ_TOPIC, 'dlq', {
      originalTopic: TOPIC,
      payload: raw,
      errorMessage: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    });
  }

  private async handleLogEvent(dto: LogEventDto) {
    const savedLog = await this.loggerCore.saveLog(dto);
    this.loggerGateway.broadcastLog(savedLog);
    this.logger.verbose(
      `Processed & broadcasted log from ${dto.service}: ${dto.level}`
    );
  }
}
