import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateBrandDto, UpdateBrandDto } from '@tec-shop/dto';
import { BrandService } from './brand.service';

@Controller()
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @MessagePattern({ cmd: 'create_brand' })
  create(@Payload() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @MessagePattern({ cmd: 'get_all_brands' })
  findAll(
    @Payload()
    options?: {
      onlyActive?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    return this.brandService.findAll(options);
  }

  @MessagePattern({ cmd: 'get_brand' })
  findOne(@Payload() data: { id: string; includeProducts?: boolean }) {
    return this.brandService.findOne(data.id, data.includeProducts);
  }

  @MessagePattern({ cmd: 'get_brand_by_slug' })
  findBySlug(@Payload() data: { slug: string; includeProducts?: boolean }) {
    return this.brandService.findBySlug(data.slug, data.includeProducts);
  }

  @MessagePattern({ cmd: 'update_brand' })
  update(@Payload() data: { id: string; updateBrandDto: UpdateBrandDto }) {
    return this.brandService.update(data.id, data.updateBrandDto);
  }

  @MessagePattern({ cmd: 'delete_brand' })
  remove(@Payload() id: string) {
    return this.brandService.remove(id);
  }

  @MessagePattern({ cmd: 'get_popular_brands' })
  getPopularBrands(@Payload() limit = 10) {
    return this.brandService.getPopularBrands(limit);
  }
}
