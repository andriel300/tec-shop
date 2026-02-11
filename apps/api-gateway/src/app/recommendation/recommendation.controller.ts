import {
  Controller,
  Get,
  Post,
  Inject,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(
    @Inject('RECOMMENDATION_SERVICE')
    private readonly recommendationService: ClientProxy
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get personalized product recommendations for a user' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved' })
  async getRecommendations(
    @Query('userId') userId: string,
    @Query('limit') limit?: string
  ) {
    this.logger.log(`Getting recommendations for user ${userId}`);
    return firstValueFrom(
      this.recommendationService.send('recommendation.getForUser', {
        userId,
        limit: limit ? parseInt(limit, 10) : undefined,
      })
    );
  }

  @Post('train')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Trigger model training (Admin only)' })
  @ApiResponse({ status: 200, description: 'Training completed' })
  async trainModel() {
    this.logger.log('Triggering recommendation model training');
    return firstValueFrom(
      this.recommendationService.send('recommendation.train', {})
    );
  }
}
