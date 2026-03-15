import { Injectable } from '@nestjs/common';
import { UserPrismaService } from '../prisma/prisma.service';
import { LogCategory } from '@tec-shop/dto';
import type { UpdateUserDto, CreateUserProfileDto } from '@tec-shop/dto';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class UserProfileService {
  constructor(
    private readonly prisma: UserPrismaService,
    private readonly logProducer: LogProducerService,
  ) {}

  async getUserProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: userId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!profile) {
      this.logProducer.warn('user-service', LogCategory.USER, 'User profile not found', {
        userId,
        metadata: { action: 'get_profile' },
      });
      return null;
    }

    return {
      ...profile,
      followersCount: profile._count.followers,
      followingCount: profile._count.following,
      _count: undefined,
    };
  }

  async updateUserProfile(userId: string, data: UpdateUserDto) {
    const result = await this.prisma.userProfile.update({
      where: { userId: userId },
      data,
    });
    this.logProducer.info('user-service', LogCategory.USER, 'User profile updated', {
      userId,
      metadata: { action: 'update_profile' },
    });
    return result;
  }

  async createUserProfile(data: CreateUserProfileDto) {
    const { userId, name, picture } = data;
    const result = await this.prisma.userProfile.create({
      data: {
        userId,
        name,
        ...(picture && { picture }),
      },
    });
    this.logProducer.info('user-service', LogCategory.USER, 'User profile created', {
      userId,
      metadata: { action: 'create_profile' },
    });
    return result;
  }
}
