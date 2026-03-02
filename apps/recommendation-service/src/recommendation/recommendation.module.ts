import { Module } from '@nestjs/common';
import { RedisModule } from '@tec-shop/redis-client';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationSchedulerService } from './recommendation-scheduler.service';
import { ModelService } from './ml/model.service';
import { ModelLoaderService } from './ml/model.loader';

@Module({
  imports: [RedisModule.forRoot()],
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
