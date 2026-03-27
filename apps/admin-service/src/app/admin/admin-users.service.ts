import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';
// TODO(migration): bcrypt kept for legacy hash verification. Remove once all users have logged in post-migration.
import * as bcrypt from 'bcrypt';
import {
  AuthPrismaService,
  UserPrismaService,
  SellerPrismaService,
} from '../../prisma/prisma.service';
import type {
  ListUsersDto,
  BanUserDto,
  CreateAdminDto,
} from '@tec-shop/dto';
import { NotificationProducerService } from '@tec-shop/notification-producer';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly authPrisma: AuthPrismaService,
    private readonly userPrisma: UserPrismaService,
    private readonly sellerPrisma: SellerPrismaService,
    private readonly notificationProducer: NotificationProducerService
  ) {}

  async listUsers(dto: ListUsersDto) {
    this.logger.log(`Listing users with filters: ${JSON.stringify(dto)}`);

    const { search, userType, status } = dto;
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (userType) {
      where.userType = userType;
    }

    if (status) {
      where.isBanned = status === 'BANNED';
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.authPrisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          userType: true,
          isEmailVerified: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.authPrisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    this.logger.log(`Fetching details for user: ${userId}`);

    const user = await this.authPrisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userType: true,
        isEmailVerified: true,
        isBanned: true,
        banReason: true,
        bannedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }

    let userProfile = null;
    if (user.userType === 'CUSTOMER') {
      userProfile = await this.userPrisma.userProfile.findUnique({
        where: { userId: userId },
      });
    }

    let sellerProfile = null;
    if (user.userType === 'SELLER') {
      sellerProfile = await this.sellerPrisma.seller.findUnique({
        where: { authId: userId },
        include: { shop: true },
      });
    }

    return {
      ...user,
      profile: userProfile || sellerProfile,
    };
  }

  async banUser(userId: string, dto: BanUserDto) {
    this.logger.log(`Banning user: ${userId}, reason: ${dto.reason}`);

    const user = await this.authPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }

    if (user.userType === 'ADMIN') {
      throw new RpcException({ statusCode: 400, message: 'Cannot ban admin users' });
    }

    if (user.isBanned) {
      throw new RpcException({ statusCode: 400, message: 'User is already banned' });
    }

    const bannedUntil =
      dto.duration && dto.duration > 0
        ? new Date(Date.now() + dto.duration * 24 * 60 * 60 * 1000)
        : null;

    const updatedUser = await this.authPrisma.user.update({
      where: { id: userId },
      data: { isBanned: true, banReason: dto.reason, bannedUntil },
      select: { id: true, email: true, isBanned: true, banReason: true, bannedUntil: true },
    });

    this.logger.log(`User ${userId} banned successfully`);

    if (user.userType === 'CUSTOMER') {
      this.notificationProducer.notifyCustomer(userId, 'system.account_banned', {});
    } else if (user.userType === 'SELLER') {
      this.notificationProducer.notifySeller(userId, 'system.account_banned', {});
    }

    return updatedUser;
  }

  async unbanUser(userId: string) {
    this.logger.log(`Unbanning user: ${userId}`);

    const user = await this.authPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }

    if (!user.isBanned) {
      throw new RpcException({ statusCode: 400, message: 'User is not banned' });
    }

    const updatedUser = await this.authPrisma.user.update({
      where: { id: userId },
      data: { isBanned: false, banReason: null, bannedUntil: null },
      select: { id: true, email: true, isBanned: true },
    });

    this.logger.log(`User ${userId} unbanned successfully`);

    if (user.userType === 'CUSTOMER') {
      this.notificationProducer.notifyCustomer(userId, 'system.account_unbanned', {});
    } else if (user.userType === 'SELLER') {
      this.notificationProducer.notifySeller(userId, 'system.account_unbanned', {});
    }

    return updatedUser;
  }

  async listAdmins() {
    this.logger.log('Listing all admin users');

    return this.authPrisma.user.findMany({
      where: { userType: 'ADMIN' },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdmin(dto: CreateAdminDto) {
    this.logger.log(`Creating new admin: ${dto.email}`);

    const existingUser = await this.authPrisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new RpcException({ statusCode: 409, message: 'User with this email already exists' });
    }

    const hashedPassword = await argon2.hash(dto.password);

    const admin = await this.authPrisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        userType: 'ADMIN',
        isEmailVerified: true,
      },
      select: {
        id: true,
        email: true,
        userType: true,
        createdAt: true,
      },
    });

    this.logger.log(`Admin created successfully: ${admin.id}`);
    return admin;
  }

  async deleteAdmin(adminId: string, confirmPassword: string, requestingAdminId: string) {
    this.logger.log(`Deleting admin: ${adminId}, requested by: ${requestingAdminId}`);

    if (adminId === requestingAdminId) {
      throw new RpcException({ statusCode: 400, message: 'Cannot delete your own admin account' });
    }

    if (!confirmPassword) {
      throw new RpcException({ statusCode: 400, message: 'Password confirmation is required to delete an admin account' });
    }

    const requestingAdmin = await this.authPrisma.user.findUnique({
      where: { id: requestingAdminId },
    });

    if (!requestingAdmin || requestingAdmin.userType !== 'ADMIN') {
      throw new RpcException({ statusCode: 400, message: 'Requesting admin not found' });
    }

    if (!requestingAdmin.password) {
      throw new RpcException({ statusCode: 400, message: 'Admin account has no password set — cannot confirm identity' });
    }

    const isPasswordValid = requestingAdmin.password.startsWith('$argon2')
      ? await argon2.verify(requestingAdmin.password, confirmPassword)
      : await bcrypt.compare(confirmPassword, requestingAdmin.password);
    if (!isPasswordValid) {
      this.logger.warn(`Delete admin rejected - wrong password from requesting admin: ${requestingAdminId}`);
      throw new RpcException({ statusCode: 400, message: 'Password confirmation is incorrect' });
    }

    const admin = await this.authPrisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new RpcException({ statusCode: 404, message: 'Admin not found' });
    }

    if (admin.userType !== 'ADMIN') {
      throw new RpcException({ statusCode: 400, message: 'User is not an admin' });
    }

    const adminCount = await this.authPrisma.user.count({
      where: { userType: 'ADMIN' },
    });

    if (adminCount <= 1) {
      throw new RpcException({ statusCode: 400, message: 'Cannot delete the last admin user. At least one admin must exist.' });
    }

    await this.authPrisma.user.delete({ where: { id: adminId } });

    this.logger.log(`Admin ${adminId} deleted successfully`);
    return { message: 'Admin deleted successfully' };
  }
}
