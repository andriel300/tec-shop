export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class SellerPayout {
  id!: string;
  orderId!: string;
  sellerId!: string;
  shopId!: string;
  stripeAccountId!: string;
  totalAmount!: number;
  platformFee!: number;
  payoutAmount!: number;
  stripeTransferId!: string | null;
  status!: PayoutStatus;
  errorMessage!: string | null;
  retryCount!: number;
  processedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
