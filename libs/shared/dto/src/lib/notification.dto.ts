export type NotificationTargetType = 'customer' | 'seller' | 'admin';

export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'ORDER'
  | 'PRODUCT'
  | 'SHOP'
  | 'SYSTEM'
  | 'AUTH'
  | 'DELIVERY';

export interface NotificationEventDto {
  targetType: NotificationTargetType;
  targetId: string;
  templateId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface NotificationResponseDto {
  id: string;
  targetType: NotificationTargetType;
  targetId: string;
  templateId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationListResponseDto {
  notifications: NotificationResponseDto[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface NotificationQueryDto {
  page?: number | string;
  limit?: number | string;
  isRead?: string;
  type?: NotificationType;
}
