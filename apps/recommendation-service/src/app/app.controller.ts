import { Controller, Get } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller()
export class AppController {
  constructor(private readonly appService: RecommendationService) {}
}
