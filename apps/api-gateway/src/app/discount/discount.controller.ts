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
  Logger,
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
  private readonly logger = new Logger(DiscountController.name);

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

    this.logger.log(`Creating discount with sellerId: ${user.userId}`);
    this.logger.debug('Full discount data:', discountData);

    try {
      const result = await firstValueFrom(
        this.sellerService.send('seller-create-discount', discountData)
      );
      this.logger.log('Seller service response:', result);
      return result;
    } catch (error) {
      this.logger.error('Error from seller-service:', error);
      throw error;
    }
  }

  /**
   * Get all discount codes (SELLER only - own discounts)
   */
  @Get()
  @Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute for read operations
  @ApiOperation({
    summary: 'Get all discount codes (SELLER only)',
    description:
      'Retrieves all discount codes created by the authenticated seller. Returns an array of discount objects with details about each promotion.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved discount codes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          code: { type: 'string', example: 'SUMMER2025' },
          discountType: {
            type: 'string',
            enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
            example: 'PERCENTAGE',
          },
          discountValue: { type: 'number', example: 20 },
          minPurchaseAmount: { type: 'number', example: 50 },
          maxDiscountAmount: { type: 'number', example: 100 },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          usageLimit: { type: 'number', example: 100 },
          usedCount: { type: 'number', example: 25 },
          isActive: { type: 'boolean', example: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller role required',
  })
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
  @ApiOperation({
    summary: 'Get discount by ID (SELLER only)',
    description:
      'Retrieves a specific discount code by its ID. Only the seller who created the discount can access it.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved discount',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        code: { type: 'string', example: 'SUMMER2025' },
        discountType: {
          type: 'string',
          enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
          example: 'PERCENTAGE',
        },
        discountValue: { type: 'number', example: 20 },
        minPurchaseAmount: { type: 'number', example: 50 },
        maxDiscountAmount: { type: 'number', example: 100 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        usageLimit: { type: 'number', example: 100 },
        usedCount: { type: 'number', example: 25 },
        isActive: { type: 'boolean', example: true },
        sellerId: { type: 'string', example: '507f1f77bcf86cd799439012' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Discount not found or does not belong to the seller',
  })
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
  @ApiOperation({
    summary: 'Update discount (SELLER only)',
    description:
      'Updates an existing discount code. Only the seller who created the discount can update it. Partial updates are supported.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({
    status: 200,
    description: 'Discount updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        code: { type: 'string', example: 'SUMMER2025' },
        discountType: {
          type: 'string',
          enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
          example: 'PERCENTAGE',
        },
        discountValue: { type: 'number', example: 25 },
        minPurchaseAmount: { type: 'number', example: 50 },
        maxDiscountAmount: { type: 'number', example: 100 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        usageLimit: { type: 'number', example: 150 },
        usedCount: { type: 'number', example: 25 },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid discount data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Discount not found or does not belong to the seller',
  })
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
  @ApiOperation({
    summary: 'Delete discount (SELLER only)',
    description:
      'Permanently deletes a discount code. Only the seller who created the discount can delete it. This action cannot be undone.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiResponse({
    status: 200,
    description: 'Discount deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Discount deleted successfully',
        },
        deletedId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Discount not found or does not belong to the seller',
  })
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
