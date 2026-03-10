import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RecommendationSchedulerService {
  private readonly logger = new Logger(RecommendationSchedulerService.name);

  constructor(
    @InjectQueue('recommendation-training') private readonly trainingQueue: Queue
  ) {}

  @Cron('0 2 * * *')
  async handleScheduledTraining() {
    this.logger.log('Enqueuing scheduled model retraining...');
    await this.trainingQueue.add(
      'train',
      {},
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } }
    );
    this.logger.log('Retraining job enqueued');
  }
}
