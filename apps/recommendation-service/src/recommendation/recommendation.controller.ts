import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecommendationService } from './recommendation.service';

@Controller()
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService
  ) {}

  @MessagePattern('recommendation.ping')
  handlePing() {
    return { status: 'alive', service: 'recommendation-service' };
  }

  @MessagePattern('recommendation.getForUser')
  async getRecommendations(
    @Payload() data: { userId: string; limit?: number }
  ) {
    return this.recommendationService.getRecommendations(
      data.userId,
      data.limit
    );
  }

  @MessagePattern('recommendation.train')
  async trainModel() {
    return this.recommendationService.trainModel();
  }

  @MessagePattern('recommendation.getPopular')
  async getPopular(@Payload() data: { limit?: number }) {
    return this.recommendationService.getPopularProducts(data.limit || 10);
  }

  @MessagePattern('recommendation.getSimilar')
  async getSimilar(
    @Payload() data: { productId: string; limit?: number }
  ) {
    return this.recommendationService.getSimilarProducts(
      data.productId,
      data.limit
    );
  }
}
