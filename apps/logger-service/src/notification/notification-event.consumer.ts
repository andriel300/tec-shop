import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { NotificationEventDto } from '@tec-shop/dto';
import { KafkaService } from '../kafka/kafka.service';
import type { Consumer } from 'kafkajs';
import { NotificationCoreService } from './notification-core.service';
import { NotificationGateway } from './notification.gateway';

const TOPIC = 'notification-events';
const GROUP_ID = 'notification-events-group';

@Injectable()
export class NotificationEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventConsumer.name);
  private kafkaConsumer: Consumer;

  constructor(
    private readonly kafka: KafkaService,
    private readonly notificationCore: NotificationCoreService,
    private readonly notificationGateway: NotificationGateway
  ) {
    this.kafkaConsumer = this.kafka.createConsumer(GROUP_ID);
  }

  async onModuleInit() {
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe({
      topic: TOPIC,
      fromBeginning: false,
    });
    this.logger.log('NotificationEventConsumer is running...');

    await this.kafkaConsumer.run({
      eachMessage: async ({
        topic: _topic,
        partition: _partition,
        message,
      }) => {
        try {
          const raw = message.value?.toString();
          if (!raw) return;

          const data: NotificationEventDto = JSON.parse(raw);
          this.logger.verbose(
            `Received notification event: ${data.templateId} -> ${data.targetType}:${data.targetId}`
          );

          await this.handleNotificationEvent(data);
        } catch (error) {
          this.logger.error('Error processing notification event', error);
        }
      },
    });
  }

  private async handleNotificationEvent(dto: NotificationEventDto) {
    const saved = await this.notificationCore.saveNotification(dto);

    if (dto.targetType === 'admin' && dto.targetId === 'all') {
      this.notificationGateway.broadcastToAllAdmins(saved);
    } else {
      this.notificationGateway.broadcastToUser(
        dto.targetType,
        dto.targetId,
        saved
      );
    }

    this.logger.verbose(
      `Processed & broadcasted notification: ${dto.templateId} -> ${dto.targetType}:${dto.targetId}`
    );
  }
}
