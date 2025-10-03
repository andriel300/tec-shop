import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateCategoryDto, UpdateCategoryDto } from '@tec-shop/dto';
import { CategoryService } from './category.service';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @MessagePattern({ cmd: 'create_category' })
  create(@Payload() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @MessagePattern({ cmd: 'get_all_categories' })
  findAll(@Payload() options?: {
    includeChildren?: boolean;
    onlyActive?: boolean;
    parentId?: string | null;
  }) {
    return this.categoryService.findAll(options);
  }

  @MessagePattern({ cmd: 'get_category' })
  findOne(@Payload() data: { id: string; includeChildren?: boolean; includeProducts?: boolean }) {
    return this.categoryService.findOne(data.id, data.includeChildren, data.includeProducts);
  }

  @MessagePattern({ cmd: 'get_category_by_slug' })
  findBySlug(@Payload() data: { slug: string; includeChildren?: boolean }) {
    return this.categoryService.findBySlug(data.slug, data.includeChildren);
  }

  @MessagePattern({ cmd: 'update_category' })
  update(@Payload() data: { id: string; updateCategoryDto: UpdateCategoryDto }) {
    return this.categoryService.update(data.id, data.updateCategoryDto);
  }

  @MessagePattern({ cmd: 'delete_category' })
  remove(@Payload() id: string) {
    return this.categoryService.remove(id);
  }

  @MessagePattern({ cmd: 'get_category_tree' })
  getCategoryTree(@Payload() onlyActive = false) {
    return this.categoryService.getCategoryTree(onlyActive);
  }
}
