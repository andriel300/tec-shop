import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RecommendationService } from './recommendation.service';

@Processor('recommendation-training')
export class RecommendationTrainingProcessor extends WorkerHost {
  private readonly logger = new Logger(RecommendationTrainingProcessor.name);

  constructor(private readonly recommendationService: RecommendationService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing training job ${job.id} (attempt ${job.attemptsMade + 1})`);

    const stats = await this.recommendationService.trainModel();

    this.logger.log(
      `Training complete: ${stats.interactions} interactions, ${stats.users} users, ${stats.products} products`
    );
  }
}
