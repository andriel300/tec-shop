import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  Length,
  MaxLength,
  IsNotEmpty,
  IsBoolean,
  IsDate,
  Min,
  Max,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

import { PartialType } from '@nestjs/mapped-types';

export class CreateSellerProfileDto {
  @IsString()
  @IsNotEmpty()
  authId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;
}

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 1000)
  bio!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  address!: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 200)
  openingHours!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;
}

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  businessName?: string;

  @IsOptional()
  @IsString()
  @Length(10, 1000)
  bio?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @Length(10, 500)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(5, 200)
  openingHours?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;
}

// ============================================
// Discount Code DTOs
// ============================================

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export class CreateDiscountDto {
  @IsString()
  @IsOptional()
  sellerId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  // eslint-disable-next-line no-control-regex
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/[\x00-\x1F\x7F]/g, '') : value))
  publicName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : value))
  code!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  // eslint-disable-next-line no-control-regex
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/[\x00-\x1F\x7F]/g, '') : value))
  description?: string;

  @IsString()
  @IsNotEmpty()
  discountType!: DiscountType;

  @IsNumber()
  @Min(0.01)
  discountValue!: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000000)
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  maxUsesPerCustomer?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999999)
  minimumPurchase?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {
  @IsString()
  @IsOptional()
  override sellerId?: never; // Cannot update sellerId
}

export interface DiscountCodeResponse {
  id: string;
  sellerId: string;
  publicName: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  usageLimit?: number | null;
  usageCount: number;
  maxUsesPerCustomer?: number | null;
  startDate: Date;
  endDate?: Date | null;
  minimumPurchase?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SellerProfileResponse {
  id: string;
  authId: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
  isVerified: boolean;
  shop?: ShopResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopResponse {
  id: string;
  sellerId: string;
  businessName: string;
  bio?: string;
  category: string;
  address: string;
  openingHours: string;
  website?: string;
  rating: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerDashboardData {
  seller: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
    createdAt: Date;
  };
  shop: {
    id: string;
    businessName: string;
    category: string;
    rating: number;
    totalOrders: number;
    isActive: boolean;
    createdAt: Date;
  } | null;
}

// ============================================
// Event DTOs
// ============================================

export type EventStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export class CreateEventDto {
  @IsString()
  @IsOptional()
  shopId?: string; // Will be set from authenticated seller's shop

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bannerImage?: string;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsEnum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: EventStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsString()
  @IsOptional()
  override shopId?: never; // Cannot update shopId
}

export interface EventResponse {
  id: string;
  shopId: string;
  title: string;
  description: string;
  bannerImage?: string | null;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  shop?: {
    id: string;
    businessName: string;
    category: string;
  };
}

// ============================================
// Notification DTOs
// ============================================

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ORDER' | 'PRODUCT' | 'SHOP' | 'SYSTEM';

export class CreateNotificationDto {
  @IsString()
  @IsOptional()
  sellerId?: string; // Will be set from authenticated seller

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;

  @IsEnum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ORDER', 'PRODUCT', 'SHOP', 'SYSTEM'])
  @IsOptional()
  type?: NotificationType;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateNotificationDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}

export interface NotificationResponse {
  id: string;
  sellerId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Seller Statistics DTOs
// ============================================

export interface SellerStatisticsResponse {
  revenue: {
    total: number; // Total revenue in cents
    thisMonth: number;
    lastMonth: number;
    growth: number; // Percentage growth
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  shop: {
    rating: number;
    totalOrders: number;
    isActive: boolean;
  };
}
