import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiscountService } from './discount.service';
import type { CreateDiscountDto, UpdateDiscountDto } from '@tec-shop/dto';

@Controller()
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @MessagePattern('seller-create-discount')
  create(@Payload() data: CreateDiscountDto) {
    return this.discountService.create(data);
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
}
