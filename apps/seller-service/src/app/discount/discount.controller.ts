import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiscountService } from './discount.service';
import type { CreateDiscountDto, UpdateDiscountDto } from '@tec-shop/dto';

@Controller()
export class DiscountController {
  private readonly logger = new Logger(DiscountController.name);

  constructor(private readonly discountService: DiscountService) {}

  @MessagePattern('seller-create-discount')
  async create(@Payload() data: CreateDiscountDto) {
    // Only log detailed data in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Received create-discount message');
      this.logger.debug(`Data: ${JSON.stringify(data)}`);
    } else {
      this.logger.log('Discount creation requested');
    }

    try {
      const result = await this.discountService.create(data);
      this.logger.log('Discount created successfully');
      return result;
    } catch (error) {
      // Log error details only in development
      if (process.env.NODE_ENV === 'development') {
        this.logger.error('Error creating discount:');
        this.logger.error(error);
        this.logger.error(`Error stack: ${error.stack}`);
        this.logger.error(`Error message: ${error.message}`);
      } else {
        this.logger.error(`Discount creation failed: ${error.message}`);
      }
      throw error;
    }
  }

  @MessagePattern('seller-get-all-discounts')
  findAll(@Payload() payload: { sellerId: string }) {
    return this.discountService.findAll(payload.sellerId);
  }

  @MessagePattern('seller-get-discount')
  findOne(@Payload() payload: { id: string; sellerId: string }) {
    return this.discountService.findOne(payload.id, payload.sellerId);
  }

  @MessagePattern('seller-update-discount')
  update(
    @Payload() payload: { id: string; updateDiscountDto: UpdateDiscountDto; sellerId: string }
  ) {
    return this.discountService.update(
      payload.id,
      payload.updateDiscountDto,
      payload.sellerId
    );
  }

  @MessagePattern('seller-delete-discount')
  remove(@Payload() payload: { id: string; sellerId: string }) {
    return this.discountService.remove(payload.id, payload.sellerId);
  }

  @MessagePattern('seller-verify-coupon-code')
  async verifyCouponCode(
    @Payload() payload: { code: string; cartItems: { productId: string; sellerId: string; subtotal: number }[] }
  ) {
    this.logger.log(`Verifying coupon code: ${payload.code}`);
    return this.discountService.verifyCouponForCart(payload.code, payload.cartItems);
  }
}
