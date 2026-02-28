import {
  Controller,
  Get,
  Post,
  Inject,
  Query,
  Param,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
    role?: string;
    userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  };
}

interface RecommendationResult {
  productId: string;
  score: number;
}

interface ProductFromService {
  id: string;
  [key: string]: unknown;
}

interface EnrichedProduct extends ProductFromService {
  score: number;
}

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(
    @Inject('RECOMMENDATION_SERVICE')
    private readonly recommendationService: ClientProxy,
    @Inject('PRODUCT_SERVICE')
    private readonly productService: ClientProxy,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get personalized product recommendations for authenticated user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Enriched recommendations retrieved' })
  async getRecommendations(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    this.logger.log(`Getting recommendations for user ${userId}`);

    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    const results = await firstValueFrom(
      this.recommendationService.send<RecommendationResult[]>('recommendation.getForUser', {
        userId,
        limit: parsedLimit,
      })
    );

    return this.enrichWithProducts(results);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular products (no auth required)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Popular products retrieved' })
  async getPopular(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    this.logger.log(`Getting popular products (limit: ${parsedLimit})`);

    const results = await firstValueFrom(
      this.recommendationService.send<RecommendationResult[]>('recommendation.getPopular', {
        limit: parsedLimit,
      })
    );

    return this.enrichWithProducts(results);
  }

  @Get('similar/:productId')
  @ApiOperation({ summary: 'Get similar products (no auth required)' })
  @ApiParam({ name: 'productId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Similar products retrieved' })
  async getSimilar(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    this.logger.log(`Getting similar products for ${productId}`);

    const results = await firstValueFrom(
      this.recommendationService.send<RecommendationResult[]>('recommendation.getSimilar', {
        productId,
        limit: parsedLimit,
      })
    );

    return this.enrichWithProducts(results);
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

  /**
   * Enrich recommendation results with full product data from product-service.
   */
  private async enrichWithProducts(
    results: RecommendationResult[]
  ): Promise<EnrichedProduct[]> {
    if (!results || results.length === 0) {
      return [];
    }

    const productIds = results.map((r) => r.productId);
    const scoreMap = new Map(results.map((r) => [r.productId, r.score]));

    const products = await firstValueFrom(
      this.productService.send<ProductFromService[]>('product-get-by-ids', { ids: productIds })
    );

    // Merge score into each product and maintain sort order by score
    const enriched: EnrichedProduct[] = products.map((product) => ({
      ...product,
      score: scoreMap.get(product.id) ?? 0,
    }));

    enriched.sort((a, b) => b.score - a.score);

    return enriched;
  }
}
