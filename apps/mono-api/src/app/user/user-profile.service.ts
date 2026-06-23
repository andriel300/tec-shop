import { Injectable, Logger } from '@nestjs/common';
import { MonoPrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(private readonly prisma: MonoPrismaService) {}

  async getUserProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { followers: true, following: true },
        },
      },
    });
    if (!profile) return null;
    return {
      ...profile,
      followersCount: profile._count.followers,
      followingCount: profile._count.following,
      _count: undefined,
    };
  }

  async createUserProfile(data: { userId: string; name: string; picture?: string }) {
    const { userId, name, picture } = data;
    const result = await this.prisma.userProfile.create({
      data: {
        userId,
        name,
        ...(picture && { picture }),
      },
    });
    this.logger.log(`User profile created for userId: ${userId}`);
    return result;
  }

  async updateUserProfile(userId: string, data: { name?: string; bio?: string; picture?: string }) {
    const result = await this.prisma.userProfile.update({
      where: { userId },
      data,
    });
    this.logger.log(`User profile updated for userId: ${userId}`);
    return result;
  }
}
