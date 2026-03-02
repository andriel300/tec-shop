export type UserAction =
  | 'add_to_wishlist'
  | 'remove_from_wishlist'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'product_view'
  | 'shop_view'
  | 'category_view'
  | 'search'
  | 'purchase'
  | 'review_submitted';

export interface UserAnalyticsEvent {
  userId: string;
  productId?: string;
  shopId?: string;
  categoryId?: string;
  action: UserAction;
  timestamp: string;
  country?: string;
  city?: string;
  device?: string;
  metadata?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEvent {
  service: string;
  level: LogLevel;
  category: string;
  message: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  traceId?: string;
}

export type SenderType = 'USER' | 'SELLER';

export interface ChatMessageEvent {
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  content: string;
  timestamp: string;
}

export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'ORDER'
  | 'PRODUCT'
  | 'SHOP'
  | 'SYSTEM';

export type NotificationTargetType = 'USER' | 'SELLER' | 'ADMIN';

export interface NotificationEvent {
  targetId: string;
  targetType: NotificationTargetType;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
}

export type OrderEventType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_refunded';

export interface OrderEvent {
  orderId: string;
  userId: string;
  shopId: string;
  eventType: OrderEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type SellerEventType =
  | 'seller_registered'
  | 'seller_approved'
  | 'seller_suspended'
  | 'shop_created'
  | 'shop_updated';

export interface SellerEvent {
  sellerId: string;
  shopId?: string;
  eventType: SellerEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
