import { apiClient } from './client';

export interface CreateNotificationData {
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ORDER' | 'PRODUCT' | 'SHOP' | 'SYSTEM';
  isRead?: boolean;
  metadata?: Record<string, unknown>;
}

export interface NotificationResponse {
  id: string;
  sellerId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ORDER' | 'PRODUCT' | 'SHOP' | 'SYSTEM';
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponse {
  data: NotificationResponse[];
  total: number;
  unreadCount: number;
}

// Notification API functions
export const createNotification = async (notificationData: CreateNotificationData): Promise<NotificationResponse> => {
  const response = await apiClient.post('/notifications', notificationData);
  return response.data;
};

export const getNotifications = async (filters?: {
  isRead?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<NotificationsListResponse> => {
  const params = new URLSearchParams();
  if (filters?.isRead !== undefined) params.append('isRead', String(filters.isRead));
  if (filters?.type) params.append('type', filters.type);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const response = await apiClient.get(`/notifications?${params.toString()}`);
  return response.data;
};

export const getNotificationById = async (notificationId: string): Promise<NotificationResponse> => {
  const response = await apiClient.get(`/notifications/${notificationId}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string): Promise<NotificationResponse> => {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string; count: number }> => {
  const response = await apiClient.patch('/notifications/mark-all-read');
  return response.data;
};

export const deleteNotification = async (notificationId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};
