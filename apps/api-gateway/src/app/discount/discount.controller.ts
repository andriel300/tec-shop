import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import * as Dto from '@tec-shop/dto';

@ApiTags('Discounts')
@Controller('seller/discounts')
export class DiscountController {
  constructor(@Inject('SELLER_SERVICE') private sellerService: ClientProxy) {}

  /**
   * Create a new discount code (SELLER only)
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Create new discount code (SELLER only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({ status: 201, description: 'Discount created successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller access required.',
  })
  async createDiscount(
    @Body() createDiscountDto: Dto.CreateDiscountDto,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string } | undefined;

    if (!user || !user.userId) {
      throw new Error('User not authenticated or userId missing from JWT');
    }

    // Include seller ID from JWT token
    const discountData = {
      ...createDiscountDto,
      sellerId: user.userId, // Override with authenticated user's ID
    };

    console.log('Creating discount with sellerId:', user.userId);
    console.log('Full discount data:', discountData);

    try {
      const result = await firstValueFrom(
        this.sellerService.send('seller-create-discount', discountData)
      );
      console.log('Seller service response:', result);
      return result;
    } catch (error) {
      console.error('Error from seller-service:', error);
      throw error;
    }
  }

  /**
   * Get all discount codes (SELLER only - own discounts)
   */
  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({ summary: 'Get all discount codes (SELLER only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getAllDiscounts(@Req() req: Record<string, unknown>) {
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.sellerService.send('seller-get-all-discounts', {
        sellerId: user.userId,
      })
    );
  }

  /**
   * Get single discount by ID (SELLER only)
   */
  @Get(':id')
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({ summary: 'Get discount by ID (SELLER only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getDiscountById(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.sellerService.send('seller-get-discount', {
        id,
        sellerId: user.userId,
      })
    );
  }

  /**
   * Update discount (SELLER only)
   */
  @Put(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Update discount (SELLER only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateDiscount(
    @Param('id') id: string,
    @Body() updateDiscountDto: Dto.UpdateDiscountDto,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.sellerService.send('seller-update-discount', {
        id,
        updateDiscountDto,
        sellerId: user.userId,
      })
    );
  }

  /**
   * Delete discount (SELLER only)
   */
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Delete discount (SELLER only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async deleteDiscount(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    const user = req.user as { userId: string };

    return firstValueFrom(
      this.sellerService.send('seller-delete-discount', {
        id,
        sellerId: user.userId,
      })
    );
  }
}
