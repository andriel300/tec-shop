import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationApi from '../lib/api/notifications';
import type {
  CreateNotificationData,
  NotificationResponse,
  NotificationsListResponse,
} from '../lib/api/notifications';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...notificationKeys.lists(), { filters }] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
};

// Hooks
export const useNotifications = (filters?: {
  isRead?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery<NotificationsListResponse, Error>({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationApi.getNotifications(filters),
    refetchInterval: 60000, // Auto-refetch every minute for new notifications
    staleTime: 30000, // 30 seconds
  });
};

export const useNotification = (notificationId: string) => {
  return useQuery<NotificationResponse, Error>({
    queryKey: notificationKeys.detail(notificationId),
    queryFn: () => notificationApi.getNotificationById(notificationId),
    enabled: !!notificationId,
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<NotificationResponse, Error, CreateNotificationData>({
    mutationFn: notificationApi.createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<NotificationResponse, Error, string>({
    mutationFn: notificationApi.markNotificationAsRead,
    onSuccess: (_data, notificationId) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; count: number }, Error>({
    mutationFn: notificationApi.markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: (_data, notificationId) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};
