import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecommendationService } from './recommendation.service';

@Injectable()
export class RecommendationSchedulerService {
  private readonly logger = new Logger(RecommendationSchedulerService.name);

  constructor(private readonly recommendationService: RecommendationService) {}

  /**
   * Retrain the recommendation model daily at 2:00 AM
   */
  @Cron('0 2 * * *')
  async handleScheduledTraining() {
    try {
      this.logger.log('Starting scheduled model retraining...');
      const stats = await this.recommendationService.trainModel();
      this.logger.log(
        `Scheduled retraining complete: ${stats.interactions} interactions, ${stats.users} users, ${stats.products} products`
      );
    } catch (error) {
      this.logger.error(
        'Scheduled model retraining failed',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
