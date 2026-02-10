'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  notificationKeys,
} from '../../hooks/use-notifications';
import { useNotificationSocket } from '../../hooks/use-notification-socket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/use-auth';

const typeColors: Record<string, string> = {
  INFO: 'bg-blue-500',
  SUCCESS: 'bg-green-500',
  WARNING: 'bg-yellow-500',
  ERROR: 'bg-red-500',
  ORDER: 'bg-purple-500',
  PRODUCT: 'bg-pink-500',
  SHOP: 'bg-orange-500',
  SYSTEM: 'bg-gray-500',
  AUTH: 'bg-cyan-500',
  DELIVERY: 'bg-teal-500',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const { unreadCount } = useNotificationSocket({
    enabled: !!isAuthenticated,
    onNotification: (notification) => {
      toast(notification.title, { description: notification.message });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const displayCount = unreadCount || data?.unreadCount || 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
      >
        <Bell size={28} className="text-text-primary" />
        {displayCount > 0 && (
          <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-5px] right-[-5px]">
            <span className="text-white font-medium text-sm">
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-ui-surface border border-ui-divider rounded-lg shadow-elev-lg z-50 max-h-[480px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ui-divider">
            <h3 className="text-text-primary font-semibold text-sm">
              Notifications
            </h3>
            {displayCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-brand-primary hover:text-brand-primary-800 flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {!data?.notifications?.length ? (
              <div className="px-4 py-8 text-center text-text-secondary text-sm">
                No notifications yet
              </div>
            ) : (
              data.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-ui-divider hover:bg-ui-muted transition-colors ${
                    !notification.isRead ? 'bg-brand-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        typeColors[notification.type] || 'bg-gray-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead.mutate(notification.id);
                          }}
                          className="p-1 text-text-tertiary hover:text-brand-primary transition-colors"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification.mutate(notification.id);
                        }}
                        className="p-1 text-text-tertiary hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-center text-sm text-brand-primary hover:text-brand-primary-800 border-t border-ui-divider hover:bg-ui-muted transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
