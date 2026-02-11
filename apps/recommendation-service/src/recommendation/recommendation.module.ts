import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationSchedulerService } from './recommendation-scheduler.service';
import { ModelService } from './ml/model.service';
import { ModelLoaderService } from './ml/model.loader';

@Module({
  imports: [RedisModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationSchedulerService,
    ModelService,
    ModelLoaderService,
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
