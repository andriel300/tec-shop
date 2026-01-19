import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  Logger,
} from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);

  private producer: Producer;
  private consumers: Consumer[] = [];

  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafka: Kafka
  ) {
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');

    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }

  async sendMessage<T>(topic: string, key: string, message: T) {
    await this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(message) }],
    });
  }

  /** Register Consumers Easily */
  createConsumer(groupId: string): Consumer {
    const consumer = this.kafka.consumer({ groupId });
    this.consumers.push(consumer);
    return consumer;
  }
}
