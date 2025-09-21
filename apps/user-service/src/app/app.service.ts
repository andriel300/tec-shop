import { Injectable } from '@nestjs/common';
import { UserPrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, CreateUserProfileDto, CreateImageDto, ImageType } from '@tec-shop/dto';

@Injectable()
export class AppService {
  constructor(private prisma: UserPrismaService) {}

  async getUserProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId: userId },
    });
  }

  async updateUserProfile(userId: string, data: UpdateUserDto) {
    return this.prisma.userProfile.update({
      where: { userId: userId },
      data,
    });
  }

  async createUserProfile(data: CreateUserProfileDto) {
    const { userId, name } = data;
    return this.prisma.userProfile.create({
      data: {
        userId,
        name,
      },
    });
  }

  // Follow functionality
  async followUser(followerId: string, followingId: string) {
    return this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    return this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async getFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: true,
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: true,
      },
    });
  }

  // Image functionality
  async createImage(data: CreateImageDto) {
    return this.prisma.image.create({
      data,
    });
  }

  async getUserImages(userProfileId: string, imageType?: ImageType) {
    return this.prisma.image.findMany({
      where: {
        userProfileId,
        ...(imageType && { imageType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteImage(imageId: string) {
    return this.prisma.image.delete({
      where: { id: imageId },
    });
  }
}
