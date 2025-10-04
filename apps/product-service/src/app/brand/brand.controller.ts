import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateBrandDto, UpdateBrandDto } from '@tec-shop/dto';
import { BrandService } from './brand.service';

@Controller()
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @MessagePattern('product-create-brand')
  create(@Payload() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @MessagePattern('product-get-all-brands')
  findAll(@Payload() options?: {
    onlyActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.brandService.findAll(options);
  }

  @MessagePattern('product-get-brand')
  findOne(@Payload() data: { id: string; includeProducts?: boolean }) {
    return this.brandService.findOne(data.id, data.includeProducts);
  }

  @MessagePattern('product-get-brand-by-slug')
  findBySlug(@Payload() data: { slug: string; includeProducts?: boolean }) {
    return this.brandService.findBySlug(data.slug, data.includeProducts);
  }

  @MessagePattern('product-update-brand')
  update(@Payload() data: { id: string; updateBrandDto: UpdateBrandDto }) {
    return this.brandService.update(data.id, data.updateBrandDto);
  }

  @MessagePattern('product-delete-brand')
  remove(@Payload() id: string) {
    return this.brandService.remove(id);
  }

  @MessagePattern('product-get-popular-brands')
  getPopularBrands(@Payload() limit = 10) {
    return this.brandService.getPopularBrands(limit);
  }
}
