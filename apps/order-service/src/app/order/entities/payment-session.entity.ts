import type { PaymentStatus } from './order.entity.js';

export class PaymentSession {
  id: string;
  sessionId: string;
  userId: string;
  cartData: Record<string, unknown>;
  shippingAddressId: string;
  shippingAddress: Record<string, unknown>;
  subtotalAmount: number;
  discountAmount: number;
  shippingCost: number;
  platformFee: number;
  finalAmount: number;
  couponCode: string | null;
  status: PaymentStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
