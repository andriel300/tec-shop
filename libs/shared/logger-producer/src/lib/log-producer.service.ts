import { Injectable, Inject, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import type { LogEventDto, LogLevel, LogCategory } from '@tec-shop/dto';

const LOG_EVENTS_TOPIC = 'log-events';

@Injectable()
export class LogProducerService {
  private readonly logger = new Logger(LogProducerService.name);
  private producer: Producer;
  private connected = false;

  constructor(
    @Inject('LOG_PRODUCER_KAFKA')
    private readonly kafka: Kafka
  ) {
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log('LogProducer connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect LogProducer to Kafka', error);
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.producer.disconnect();
      this.logger.log('LogProducer disconnected from Kafka');
    }
  }

  async emit(event: LogEventDto): Promise<void> {
    if (!this.connected) {
      this.logger.warn('LogProducer not connected, log event dropped');
      return;
    }

    try {
      const timestamp = event.timestamp || new Date().toISOString();
      const message: LogEventDto = {
        ...event,
        timestamp,
      };

      await this.producer.send({
        topic: LOG_EVENTS_TOPIC,
        messages: [
          {
            key: event.service,
            value: JSON.stringify(message),
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to emit log event', error);
    }
  }

  async debug(
    service: string,
    category: LogCategory,
    message: string,
    options?: Partial<Omit<LogEventDto, 'service' | 'level' | 'category' | 'message'>>
  ): Promise<void> {
    await this.emit({
      service,
      level: 'debug' as LogLevel,
      category,
      message,
      ...options,
    });
  }

  async info(
    service: string,
    category: LogCategory,
    message: string,
    options?: Partial<Omit<LogEventDto, 'service' | 'level' | 'category' | 'message'>>
  ): Promise<void> {
    await this.emit({
      service,
      level: 'info' as LogLevel,
      category,
      message,
      ...options,
    });
  }

  async warn(
    service: string,
    category: LogCategory,
    message: string,
    options?: Partial<Omit<LogEventDto, 'service' | 'level' | 'category' | 'message'>>
  ): Promise<void> {
    await this.emit({
      service,
      level: 'warn' as LogLevel,
      category,
      message,
      ...options,
    });
  }

  async error(
    service: string,
    category: LogCategory,
    message: string,
    options?: Partial<Omit<LogEventDto, 'service' | 'level' | 'category' | 'message'>>
  ): Promise<void> {
    await this.emit({
      service,
      level: 'error' as LogLevel,
      category,
      message,
      ...options,
    });
  }

  async fatal(
    service: string,
    category: LogCategory,
    message: string,
    options?: Partial<Omit<LogEventDto, 'service' | 'level' | 'category' | 'message'>>
  ): Promise<void> {
    await this.emit({
      service,
      level: 'fatal' as LogLevel,
      category,
      message,
      ...options,
    });
  }
}
