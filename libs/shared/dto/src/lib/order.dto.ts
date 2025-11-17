import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'card',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  sellerId!: string;

  @IsString()
  @IsNotEmpty()
  shopId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsString()
  @IsNotEmpty()
  productSlug!: string;

  @IsString()
  @IsOptional()
  productImage?: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @Min(1)
  unitPrice!: number; // In cents

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateCheckoutSessionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @IsString()
  @IsNotEmpty()
  shippingAddressId!: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod!: PaymentMethod;
}

export class VerifyCouponDto {
  @IsString()
  @IsNotEmpty()
  couponCode!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;
}

export class OrderResponseDto {
  id!: string;
  orderNumber!: string;
  userId!: string;
  shippingAddress!: Record<string, unknown>;
  subtotalAmount!: number;
  discountAmount!: number;
  shippingCost!: number;
  platformFee!: number;
  finalAmount!: number;
  couponCode?: string;
  status!: OrderStatus;
  paymentStatus!: PaymentStatus;
  paymentMethod?: string;
  items!: OrderItemResponseDto[];
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export class OrderItemResponseDto {
  id!: string;
  sellerId!: string;
  shopId!: string;
  shopName!: string;
  productId!: string;
  productName!: string;
  productSlug!: string;
  productImage?: string;
  variantId?: string;
  sku?: string;
  unitPrice!: number;
  quantity!: number;
  subtotal!: number;
  sellerPayout!: number;
  platformFee!: number;
}

export class CheckoutSessionResponseDto {
  sessionId!: string;
  sessionUrl!: string;
  expiresAt!: Date;
}

export class GetSellerOrdersDto {
  @IsString()
  @IsNotEmpty()
  sellerId!: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  shopId?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
