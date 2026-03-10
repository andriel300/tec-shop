import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@tec-shop/redis-client';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationSchedulerService } from './recommendation-scheduler.service';
import { RecommendationTrainingProcessor } from './recommendation-training.processor';
import { ModelService } from './ml/model.service';
import { ModelLoaderService } from './ml/model.loader';

@Module({
  imports: [
    RedisModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: 'recommendation-training' }),
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationSchedulerService,
    RecommendationTrainingProcessor,
    ModelService,
    ModelLoaderService,
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
