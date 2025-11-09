import { Controller, Get, Inject, Param, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Public Shops')
@Controller('public/shops')
export class PublicShopsController {
  constructor(
    @Inject('SELLER_SERVICE') private sellerService: ClientProxy
  ) {}

  @Get(':shopId')
  @ApiOperation({
    summary: 'Get public shop details by ID',
    description: 'Returns public shop information including name, description, address, and ratings. No authentication required.',
  })
  @ApiParam({
    name: 'shopId',
    description: 'Shop ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Shop details retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Shop not found.',
  })
  @Throttle({ long: { limit: 200, ttl: 60000 } })
  async getShopById(@Param('shopId') shopId: string) {
    try {
      const shop = await firstValueFrom(
        this.sellerService.send('seller-get-shop-by-id', { shopId })
      );
      return shop;
    } catch (error) {
      throw new NotFoundException('Shop not found');
    }
  }
}
