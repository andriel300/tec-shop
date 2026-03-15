import { Injectable } from '@nestjs/common';
import { UserPrismaService } from '../prisma/prisma.service';
import type { CreateImageDto, ImageType } from '@tec-shop/dto';

@Injectable()
export class ImageService {
  constructor(private readonly prisma: UserPrismaService) {}

  async createImage(data: CreateImageDto) {
    return this.prisma.image.create({ data });
  }

  async getUserImages(userProfileId: string, imageType?: ImageType) {
    return this.prisma.image.findMany({
      where: {
        userProfileId,
        ...(imageType && { imageType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteImage(imageId: string) {
    return this.prisma.image.delete({ where: { id: imageId } });
  }
}
