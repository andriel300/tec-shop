import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../lib/api/notifications-v2';
import type { NotificationQueryParams } from '../lib/api/notifications-v2';

export const notificationV2Keys = {
  all: ['notifications-v2'] as const,
  lists: () => [...notificationV2Keys.all, 'list'] as const,
  list: (filters?: NotificationQueryParams) =>
    [...notificationV2Keys.lists(), filters] as const,
  unread: () => [...notificationV2Keys.all, 'unread'] as const,
};

export function useNotificationsV2(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: notificationV2Keys.list(params),
    queryFn: () => notificationsApi.getNotifications(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useUnreadCountV2() {
  return useQuery({
    queryKey: notificationV2Keys.unread(),
    queryFn: notificationsApi.getUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkAsReadV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationV2Keys.all });
    },
  });
}

export function useMarkAllAsReadV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationV2Keys.all });
    },
  });
}

export function useDeleteNotificationV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationV2Keys.all });
    },
  });
}
