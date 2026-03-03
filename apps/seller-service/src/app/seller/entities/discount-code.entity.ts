export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export class DiscountCode {
  id!: string;
  sellerId!: string;
  publicName!: string;
  code!: string;
  description!: string | null;
  discountType!: DiscountType;
  discountValue!: number;
  usageLimit!: number | null;
  usageCount!: number;
  maxUsesPerCustomer!: number | null;
  startDate!: Date;
  endDate!: Date | null;
  minimumPurchase!: number | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
