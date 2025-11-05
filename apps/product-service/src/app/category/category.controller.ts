import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateCategoryDto, UpdateCategoryDto } from '@tec-shop/dto';
import { CategoryService } from './category.service';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @MessagePattern('product-create-category')
  create(@Payload() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @MessagePattern('product-get-all-categories')
  findAll(
    @Payload()
    options?: {
      includeChildren?: boolean;
      onlyActive?: boolean;
      parentId?: string | null;
    }
  ) {
    return this.categoryService.findAll(options);
  }

  @MessagePattern('product-get-category')
  findOne(
    @Payload()
    data: {
      id: string;
      includeChildren?: boolean;
      includeProducts?: boolean;
    }
  ) {
    return this.categoryService.findOne(
      data.id,
      data.includeChildren,
      data.includeProducts
    );
  }

  @MessagePattern('product-get-category-by-slug')
  findBySlug(@Payload() data: { slug: string; includeChildren?: boolean }) {
    return this.categoryService.findBySlug(data.slug, data.includeChildren);
  }

  @MessagePattern('product-update-category')
  update(
    @Payload() data: { id: string; updateCategoryDto: UpdateCategoryDto }
  ) {
    return this.categoryService.update(data.id, data.updateCategoryDto);
  }

  @MessagePattern('product-delete-category')
  remove(@Payload() id: string) {
    return this.categoryService.remove(id);
  }

  @MessagePattern('product-get-category-tree')
  getCategoryTree(@Payload() onlyActive = false) {
    return this.categoryService.getCategoryTree(onlyActive);
  }
}
