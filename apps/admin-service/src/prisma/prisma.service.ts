import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient as AuthPrismaClient } from '@tec-shop/auth-client';
import { PrismaClient as UserPrismaClient } from '@tec-shop/user-client';
import { PrismaClient as SellerPrismaClient } from '@tec-shop/seller-client';
import { PrismaClient as OrderPrismaClient } from '@tec-shop/order-client';

/**
 * Auth Prisma Service
 * Connects to auth-schema database (User, RefreshToken, PasswordResetToken)
 */
@Injectable()
export class AuthPrismaService
  extends AuthPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuthPrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Auth Prisma Client connected successfully');
    } catch (error) {
      this.logger.error('Auth Prisma Client connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Auth Prisma Client disconnected');
  }
}

/**
 * User Prisma Service
 * Connects to user-schema database (UserProfile, ShippingAddress, etc.)
 */
@Injectable()
export class UserPrismaService
  extends UserPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(UserPrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('User Prisma Client connected successfully');
    } catch (error) {
      this.logger.error('User Prisma Client connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('User Prisma Client disconnected');
  }
}

/**
 * Seller Prisma Service
 * Connects to seller-schema database (Seller, Shop, DiscountCode, etc.)
 */
@Injectable()
export class SellerPrismaService
  extends SellerPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SellerPrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Seller Prisma Client connected successfully');
    } catch (error) {
      this.logger.error('Seller Prisma Client connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Seller Prisma Client disconnected');
  }
}

/**
 * Order Prisma Service
 * Connects to order-schema database (Order, OrderItem, SellerPayout, etc.)
 */
@Injectable()
export class OrderPrismaService
  extends OrderPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(OrderPrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Order Prisma Client connected successfully');
    } catch (error) {
      this.logger.error('Order Prisma Client connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Order Prisma Client disconnected');
  }
}
