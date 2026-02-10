import { apiClient } from './client';

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

export interface NotificationEntry {
  id: string;
  targetType: string;
  targetId: string;
  templateId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationEntry[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: string;
  type?: NotificationType;
}

export async function getNotifications(
  params?: NotificationQueryParams
): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.isRead) searchParams.set('isRead', params.isRead);
  if (params?.type) searchParams.set('type', params.type);

  const query = searchParams.toString();
  const url = query ? `user-notifications?${query}` : 'user-notifications';
  const { data } = await apiClient.get<NotificationListResponse>(url);
  return data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>(
    'user-notifications/unread'
  );
  return data;
}

export async function markAsRead(
  notificationId: string
): Promise<NotificationEntry> {
  const { data } = await apiClient.patch<NotificationEntry>(
    `user-notifications/${notificationId}/read`
  );
  return data;
}

export async function markAllAsRead(): Promise<{
  message: string;
  count: number;
}> {
  const { data } = await apiClient.patch<{ message: string; count: number }>(
    'user-notifications/read-all'
  );
  return data;
}

export async function deleteNotification(
  notificationId: string
): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `user-notifications/${notificationId}`
  );
  return data;
}
