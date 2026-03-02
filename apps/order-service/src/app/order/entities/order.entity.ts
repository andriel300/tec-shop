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

export class Order {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddressId: string;
  shippingAddress: Record<string, unknown>;
  stripeSessionId: string | null;
  stripePaymentId: string | null;
  paymentMethod: string | null;
  subtotalAmount: number;
  discountAmount: number;
  shippingCost: number;
  platformFee: number;
  finalAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingNumber: string | null;
  estimatedDelivery: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
