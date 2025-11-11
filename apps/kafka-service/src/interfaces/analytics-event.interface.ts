/**
 * Valid action types for analytics events
 */
export type AnalyticsAction =
  | 'add_to_wishlist'
  | 'add_to_cart'
  | 'product_view'
  | 'remove_from_wishlist'
  | 'shop_visit'
  | 'remove_from_cart'
  | 'purchase';

/**
 * Analytics event structure from Kafka messages
 */
export interface AnalyticsEvent {
  /** User ID who performed the action */
  userId: string;

  /** Product ID (optional, not present for shop visits) */
  productId?: string;

  /** Shop ID (optional) */
  shopId?: string;

  /** Type of action performed */
  action: AnalyticsAction;

  /** Timestamp when the event occurred */
  timestamp: Date;

  /** User's country (from location tracking) */
  country?: string;

  /** User's city (from location tracking) */
  city?: string;

  /** Device information (e.g., "Desktop - Windows 10 - Chrome 120") */
  device?: string;
}

/**
 * Kafka message payload structure
 */
export interface KafkaEventPayload {
  userId: string;
  productId?: string;
  shopId?: string;
  action: string;
  timestamp?: string | Date;
  country?: string;
  city?: string;
  device?: string;
}
