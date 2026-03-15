import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserPrismaService } from '../prisma/prisma.service';
import { LogCategory } from '@tec-shop/dto';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class ShopFollowService {
  constructor(
    private readonly prisma: UserPrismaService,
    private readonly logProducer: LogProducerService,
  ) {}

  async followShop(userId: string, shopId: string) {
    const existingFollow = await this.prisma.shopFollower.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });

    if (existingFollow) {
      throw new RpcException({ statusCode: 400, message: 'You are already following this shop' });
    }

    const result = await this.prisma.shopFollower.create({
      data: { userId, shopId },
    });
    this.logProducer.info('user-service', LogCategory.USER, 'User followed a shop', {
      userId,
      metadata: { action: 'follow_shop', shopId },
    });
    return result;
  }

  async unfollowShop(userId: string, shopId: string) {
    const existingFollow = await this.prisma.shopFollower.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });

    if (!existingFollow) {
      throw new RpcException({ statusCode: 404, message: 'You are not following this shop' });
    }

    const result = await this.prisma.shopFollower.delete({
      where: { userId_shopId: { userId, shopId } },
    });
    this.logProducer.info('user-service', LogCategory.USER, 'User unfollowed a shop', {
      userId,
      metadata: { action: 'unfollow_shop', shopId },
    });
    return result;
  }

  async getShopFollowersCount(shopId: string) {
    const count = await this.prisma.shopFollower.count({
      where: { shopId },
    });
    return { count };
  }

  async checkUserFollowsShop(userId: string, shopId: string) {
    const follow = await this.prisma.shopFollower.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });
    return { isFollowing: !!follow };
  }

  async getUserFollowedShops(userId: string) {
    return this.prisma.shopFollower.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
