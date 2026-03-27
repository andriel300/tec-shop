import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserPrismaService } from '../../prisma/prisma.service';
import type {
  UpdateLayoutDto,
  CreateHeroSlideDto,
  UpdateHeroSlideDto,
} from '@tec-shop/dto';

@Injectable()
export class AdminLayoutService {
  private readonly logger = new Logger(AdminLayoutService.name);

  constructor(private readonly userPrisma: UserPrismaService) {}

  private async getOrCreateSiteLayout() {
    let layout = await this.userPrisma.siteLayout.findFirst();
    if (!layout) {
      layout = await this.userPrisma.siteLayout.create({ data: {} });
      this.logger.log('Created default site layout');
    }
    return layout;
  }

  async getLayout() {
    this.logger.log('Fetching site layout');

    const include = { heroSlides: { orderBy: { order: 'asc' as const } } };
    let layout = await this.userPrisma.siteLayout.findFirst({ include });

    if (!layout) {
      layout = await this.userPrisma.siteLayout.create({ data: {}, include });
      this.logger.log('Created default site layout');
    }

    return { layout };
  }

  async updateLayout(dto: UpdateLayoutDto) {
    this.logger.log(`Updating site layout: ${JSON.stringify(dto)}`);

    const existing = await this.getOrCreateSiteLayout();
    const layout = await this.userPrisma.siteLayout.update({
      where: { id: existing.id },
      data: { logo: dto.logo },
    });

    this.logger.log('Site layout updated successfully');
    return { layout };
  }

  async createHeroSlide(dto: CreateHeroSlideDto) {
    this.logger.log(`Creating hero slide: ${dto.title}`);

    const layout = await this.getOrCreateSiteLayout();

    const slide = await this.userPrisma.heroSlide.create({
      data: {
        siteLayoutId: layout.id,
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        actionUrl: dto.actionUrl,
        actionLabel: dto.actionLabel,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Hero slide created: ${slide.id}`);
    return slide;
  }

  async updateHeroSlide(slideId: string, dto: UpdateHeroSlideDto) {
    this.logger.log(`Updating hero slide: ${slideId}`);

    const existing = await this.userPrisma.heroSlide.findUnique({
      where: { id: slideId },
    });

    if (!existing) {
      throw new RpcException({ statusCode: 404, message: 'Hero slide not found' });
    }

    const updated = await this.userPrisma.heroSlide.update({
      where: { id: slideId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.actionUrl !== undefined && { actionUrl: dto.actionUrl }),
        ...(dto.actionLabel !== undefined && { actionLabel: dto.actionLabel }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Hero slide updated: ${slideId}`);
    return updated;
  }

  async deleteHeroSlide(slideId: string) {
    this.logger.log(`Deleting hero slide: ${slideId}`);

    const existing = await this.userPrisma.heroSlide.findUnique({
      where: { id: slideId },
    });

    if (!existing) {
      throw new RpcException({ statusCode: 404, message: 'Hero slide not found' });
    }

    await this.userPrisma.heroSlide.delete({ where: { id: slideId } });

    this.logger.log(`Hero slide deleted: ${slideId}`);
    return { message: 'Hero slide deleted successfully' };
  }

  async reorderHeroSlides(slideIds: string[]) {
    this.logger.log(`Reordering hero slides: ${slideIds.length} slides`);

    await this.userPrisma.$transaction(
      slideIds.map((id, index) =>
        this.userPrisma.heroSlide.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    this.logger.log('Hero slides reordered successfully');
    return { message: 'Hero slides reordered successfully' };
  }
}
