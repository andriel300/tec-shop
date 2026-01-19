import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  @MessagePattern('recommendation.ping')
  handlePing() {
    return 'recommendation service alive';
  }

  @MessagePattern('recommendation.getForUser')
  getRecommendations(@Payload() data: { userId: string }) {
    this.logger.debug(`Requesting recommendations for user ${data.userId}`);

    // TODO: AI-based recommendation logic goes here
    return [];
  }

  @MessagePattern('recommendation.recordInteraction')
  recordInteraction(@Payload() data: any) {
    this.logger.debug('User interaction event', data);

    // TODO: Write to DB or Kafka for training
    return { stored: true };
  }
}
