import { Controller, Get, Post, Body, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    @Inject('RECOMMENDATION_SERVICE')
    private readonly recommendationService: ClientProxy
  ) {}

  @Get()
  async getRecommendations(@Query('userId') userId: string) {
    return firstValueFrom(
      this.recommendationService.send('recommendation-get', { userId })
    );
  }

  @Post('feedback')
  async sendFeedback(
    @Body() data: { userId: string; productId: string; liked: boolean }
  ) {
    return firstValueFrom(
      this.recommendationService.send('recommendation-feedback', data)
    );
  }
}
