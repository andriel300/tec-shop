import { Injectable } from '@nestjs/common';
import { UserPrismaService } from '../prisma/prisma.service';
import { LogCategory } from '@tec-shop/dto';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class UserFollowService {
  constructor(
    private readonly prisma: UserPrismaService,
    private readonly logProducer: LogProducerService,
  ) {}

  async followUser(followerId: string, followingId: string) {
    const result = await this.prisma.follow.create({
      data: { followerId, followingId },
    });
    this.logProducer.info('user-service', LogCategory.USER, 'User followed another user', {
      userId: followerId,
      metadata: { action: 'follow_user', followingId },
    });
    return result;
  }

  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    this.logProducer.info('user-service', LogCategory.USER, 'User unfollowed another user', {
      userId: followerId,
      metadata: { action: 'unfollow_user', followingId },
    });
    return result;
  }

  async getFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });
  }
}
