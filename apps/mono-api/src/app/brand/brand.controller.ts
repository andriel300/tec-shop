import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonoPrismaService } from '../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';

@ApiTags('Brands')
@Controller('brands')
export class BrandController {

  constructor(
    private readonly prisma: MonoPrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all active brands' })
  @ApiResponse({ status: 200, description: 'Brands retrieved successfully' })
  async getBrands() {
    const cacheKey = 'cache:brands:list';
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached !== null) return cached;

    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    await this.redisService.setJson(cacheKey, brands, 600);
    return brands;
  }
}
