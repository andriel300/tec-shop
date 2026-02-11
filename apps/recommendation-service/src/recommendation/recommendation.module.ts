import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { ModelService } from './ml/model.service';
import { ModelLoaderService } from './ml/model.loader';

@Module({
  controllers: [RecommendationController],
  providers: [RecommendationService, ModelService, ModelLoaderService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
