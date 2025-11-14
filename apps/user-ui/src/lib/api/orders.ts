import { apiClient } from './client';

export interface OrderItem {
  id: string;
  sellerId: string;
  shopId: string;
  shopName: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  variantId?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  sellerPayout: number;
  platformFee: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    phoneNumber?: string;
  };
  stripeSessionId?: string;
  stripePaymentId?: string;
  paymentMethod?: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingCost: number;
  platformFee: number;
  finalAmount: number;
  couponCode?: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  items: OrderItem[];
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const getUserOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get('/orders');
  return response.data;
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  const response = await apiClient.get(`/orders/${orderId}`);
  return response.data;
};

export const getOrderByNumber = async (orderNumber: string): Promise<Order> => {
  const response = await apiClient.get(`/orders/number/${orderNumber}`);
  return response.data;
};
