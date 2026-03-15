import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserPrismaService } from '../prisma/prisma.service';
import type { CreateShippingAddressDto, UpdateShippingAddressDto } from '@tec-shop/dto';

@Injectable()
export class ShippingAddressService {
  constructor(private readonly prisma: UserPrismaService) {}

  async createShippingAddress(userId: string, data: CreateShippingAddressDto) {
    const existingCount = await this.prisma.shippingAddress.count({ where: { userId } });

    if (existingCount >= 5) {
      throw new RpcException({
        statusCode: 400,
        message: 'Maximum limit of 5 shipping addresses reached. Please delete an existing address to add a new one.',
      });
    }

    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });

    if (!userProfile) {
      throw new RpcException({ statusCode: 404, message: 'User profile not found' });
    }

    const shouldBeDefault = existingCount === 0 || data.isDefault === true;

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

  async updateShippingAddress(userId: string, addressId: string, data: UpdateShippingAddressDto) {
    const existingAddress = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

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
    const existingAddress = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

    const wasDefault = existingAddress.isDefault;

    await this.prisma.$transaction(async (tx) => {
      await tx.shippingAddress.delete({ where: { id: addressId } });

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
    const existingCount = await this.prisma.shippingAddress.count({ where: { userId } });

    if (existingCount >= 5) {
      throw new RpcException({
        statusCode: 400,
        message: 'Maximum limit of 5 shipping addresses reached. Please delete an existing address before copying.',
      });
    }

    const originalAddress = await this.prisma.shippingAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!originalAddress) {
      throw new RpcException({ statusCode: 404, message: 'Shipping address not found' });
    }

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
        isDefault: false,
      },
    });
  }
}
