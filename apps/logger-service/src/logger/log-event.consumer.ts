import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { LogEventDto } from '@tec-shop/dto';
import { KafkaService } from '../kafka/kafka.service';
import type { Consumer } from 'kafkajs';
import { LoggerCoreService } from './logger-core.service';
import { LoggerGateway } from './logger.gateway';

const TOPIC = 'log-events';
const GROUP_ID = 'log-events-group';

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
      eachMessage: async ({
        topic: _topic,
        partition: _partition,
        message,
      }) => {
        try {
          const raw = message.value?.toString();
          if (!raw) return;

          const data: LogEventDto = JSON.parse(raw);
          this.logger.verbose(
            `Received log event from ${data.service}: ${data.level} - ${data.message.substring(0, 50)}`
          );

          await this.handleLogEvent(data);
        } catch (error) {
          this.logger.error('Error processing log event', error);
        }
      },
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
