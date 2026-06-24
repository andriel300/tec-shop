import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MonoPrismaService } from '../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {

  constructor(
    private readonly prisma: MonoPrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all active categories' })
  @ApiQuery({ name: 'includeChildren', required: false, type: Boolean, description: 'Include child categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(@Query('includeChildren') includeChildren?: boolean) {
    const cacheKey = `cache:categories:list:${includeChildren ?? false}`;
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached !== null) return cached;

    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { position: 'asc' },
      include: includeChildren
        ? {
            children: {
              where: { isActive: true },
              orderBy: { position: 'asc' },
            },
          }
        : undefined,
    });

    await this.redisService.setJson(cacheKey, categories, 600);
    return categories;
  }
}
