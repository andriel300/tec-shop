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
} from 'class-validator';

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
  @IsNotEmpty()
  sellerId!: string;

  @IsString()
  @IsNotEmpty()
  publicName!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  discountType!: DiscountType;

  @IsNumber()
  @Min(0.01)
  discountValue!: number;

  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  maxUsesPerCustomer?: number;

  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsNumber()
  @IsOptional()
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
