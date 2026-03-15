import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserPrismaService } from '../prisma/prisma.service';
import { LogCategory } from '@tec-shop/dto';
import type {
  UpdateUserDto,
  CreateUserProfileDto,
  CreateImageDto,
  ImageType,
  CreateShippingAddressDto,
  UpdateShippingAddressDto,
} from '@tec-shop/dto';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class AppService {
  constructor(
    private prisma: UserPrismaService,
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

    // Transform to match frontend expectations
    return {
      ...profile,
      followersCount: profile._count.followers,
      followingCount: profile._count.following,
      _count: undefined, // Remove internal Prisma field
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

  // Follow functionality
  async followUser(followerId: string, followingId: string) {
    const result = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
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
        followerId_followingId: {
          followerId,
          followingId,
        },
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
            // userId excluded — internal cross-service auth reference
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
            // userId excluded — internal cross-service auth reference
          },
        },
      },
    });
  }

  // Shop Follow functionality
  async followShop(userId: string, shopId: string) {
    // Check if already following
    const existingFollow = await this.prisma.shopFollower.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    if (existingFollow) {
      throw new RpcException({ statusCode: 400, message: 'You are already following this shop' });
    }

    const result = await this.prisma.shopFollower.create({
      data: {
        userId,
        shopId,
      },
    });
    this.logProducer.info('user-service', LogCategory.USER, 'User followed a shop', {
      userId,
      metadata: { action: 'follow_shop', shopId },
    });
    return result;
  }

  async unfollowShop(userId: string, shopId: string) {
    const existingFollow = await this.prisma.shopFollower.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    if (!existingFollow) {
      throw new RpcException({ statusCode: 404, message: 'You are not following this shop' });
    }

    const result = await this.prisma.shopFollower.delete({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
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
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    return { isFollowing: !!follow };
  }

  async getUserFollowedShops(userId: string) {
    return this.prisma.shopFollower.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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

  // Shipping Address functionality
  async createShippingAddress(
    userId: string,
    data: CreateShippingAddressDto
  ) {
    // Check if user has reached the limit (5 addresses)
    const existingCount = await this.prisma.shippingAddress.count({
      where: { userId },
    });

    if (existingCount >= 5) {
      throw new RpcException({ statusCode: 400, message: 'Maximum limit of 5 shipping addresses reached. Please delete an existing address to add a new one.' });
    }

    // Get user profile to link the address
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      throw new RpcException({ statusCode: 404, message: 'User profile not found' });
    }

    // If this is the first address or isDefault is true, set it as default
    const shouldBeDefault = existingCount === 0 || data.isDefault === true;

    // If setting as default, unset other defaults first
    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.shippingAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.shippingAddress.create({
        data: {
          userId,
          userProfileId: userProfile.id,
          label: data.label,
          name: data.name,
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          phoneNumber: data.phoneNumber,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async getShippingAddresses(userId: string) {
    return this.prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getShippingAddress(userId: string, addressId: string) {
    const address = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

    return address;
  }

  async updateShippingAddress(
    userId: string,
    addressId: string,
    data: UpdateShippingAddressDto
  ) {
    // Verify the address belongs to the user
    const existingAddress = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

    // If setting as default, unset other defaults first
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.shippingAddress.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.shippingAddress.update({
        where: { id: addressId },
        data,
      });
    });
  }

  async deleteShippingAddress(userId: string, addressId: string) {
    // Verify the address belongs to the user
    const existingAddress = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

    const wasDefault = existingAddress.isDefault;

    await this.prisma.$transaction(async (tx) => {
      await tx.shippingAddress.delete({ where: { id: addressId } });

      // If the deleted address was default, promote the most recent remaining
      if (wasDefault) {
        const next = await tx.shippingAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (next) {
          await tx.shippingAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { message: 'Shipping address deleted successfully' };
  }

  async setDefaultShippingAddress(userId: string, addressId: string) {
    // Verify the address belongs to the user
    const existingAddress = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.shippingAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.shippingAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  async copyShippingAddress(userId: string, addressId: string) {
    // Check if user has reached the limit (5 addresses)
    const existingCount = await this.prisma.shippingAddress.count({
      where: { userId },
    });

    if (existingCount >= 5) {
      throw new RpcException({ statusCode: 400, message: 'Maximum limit of 5 shipping addresses reached. Please delete an existing address before copying.' });
    }

    // Get the address to copy
    const originalAddress = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!originalAddress) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

    // Create a copy with "(Copy)" appended to the label
    return this.prisma.shippingAddress.create({
      data: {
        userId: originalAddress.userId,
        userProfileId: originalAddress.userProfileId,
        label: `${originalAddress.label} (Copy)`,
        name: originalAddress.name,
        street: originalAddress.street,
        city: originalAddress.city,
        state: originalAddress.state,
        zipCode: originalAddress.zipCode,
        country: originalAddress.country,
        phoneNumber: originalAddress.phoneNumber,
        isDefault: false, // Copies are never default
      },
    });
  }
}
