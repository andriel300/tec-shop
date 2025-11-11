import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum AnalyticsAction {
  ADD_TO_WISHLIST = 'add_to_wishlist',
  ADD_TO_CART = 'add_to_cart',
  PRODUCT_VIEW = 'product_view',
  REMOVE_FROM_WISHLIST = 'remove_from_wishlist',
  SHOP_VISIT = 'shop_visit',
  REMOVE_FROM_CART = 'remove_from_cart',
  PURCHASE = 'purchase',
}

export class TrackEventDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  shopId?: string;

  @IsEnum(AnalyticsAction)
  action!: AnalyticsAction;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  device?: string;
}
