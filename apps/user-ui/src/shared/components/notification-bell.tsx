'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import type { NotificationEntry } from '../../lib/api/notifications';

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

const typeBorders: Record<string, string> = {
  INFO: 'border-l-blue-500',
  SUCCESS: 'border-l-green-500',
  WARNING: 'border-l-yellow-500',
  ERROR: 'border-l-red-500',
  ORDER: 'border-l-purple-500',
  PRODUCT: 'border-l-pink-500',
  SHOP: 'border-l-orange-500',
  SYSTEM: 'border-l-gray-500',
  AUTH: 'border-l-cyan-500',
  DELIVERY: 'border-l-teal-500',
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

function getNotificationLink(notification: NotificationEntry): string | null {
  if (notification.templateId === 'chat.new_message') {
    const conversationId = notification.metadata?.conversationId as
      | string
      | undefined;
    if (conversationId) return `/inbox?conversationId=${conversationId}`;
  }
  return null;
}

function NotificationToast({
  notification,
  link,
  onClose,
}: {
  notification: NotificationEntry;
  link: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const borderColor = typeBorders[notification.type] || 'border-l-gray-500';

  const handleBodyClick = () => {
    if (link) {
      router.push(link);
      onClose();
    }
  };

  return (
    <div
      className={`flex items-start gap-3 bg-white border border-gray-200 border-l-4 ${borderColor} rounded-lg shadow-lg p-3.5 w-[360px] max-w-[calc(100vw-32px)]`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          notification.templateId === 'chat.new_message'
            ? 'bg-blue-100'
            : 'bg-gray-100'
        }`}
      >
        {notification.templateId === 'chat.new_message' ? (
          <MessageSquare size={14} className="text-blue-600" />
        ) : (
          <div
            className={`w-2 h-2 rounded-full ${typeColors[notification.type] || 'bg-gray-500'}`}
          />
        )}
      </div>

      <div
        className={`flex-1 min-w-0 ${link ? 'cursor-pointer' : ''}`}
        onClick={handleBodyClick}
      >
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          {notification.title}
        </p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        {link && (
          <p className="text-xs text-blue-600 mt-1.5 font-medium flex items-center gap-1">
            <span>Open conversation</span>
            <span className="text-[10px]">&#8594;</span>
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors mt-0.5"
        aria-label="Close"
      >
        <X size={13} />
      </button>
    </div>
  );
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

  const { unreadCount, setUnreadCount } = useNotificationSocket({
    enabled: !!isAuthenticated,
    onNotification: (notification) => {
      const link = getNotificationLink(notification);
      toast.custom(
        (toastId) => (
          <NotificationToast
            notification={notification}
            link={link}
            onClose={() => toast.dismiss(toastId)}
          />
        ),
        { duration: 6000 }
      );
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  // Use socket count when it reflects real-time arrivals; fall back to server count.
  // After mark-all-read the socket count is reset to 0 so server count takes over.
  const displayCount = Math.max(unreadCount, data?.unreadCount ?? 0);

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        setUnreadCount(0);
      },
    });
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id, {
      onSuccess: () => {
        setUnreadCount(Math.max(0, unreadCount - 1));
      },
    });
  };

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
                onClick={handleMarkAllRead}
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
              data.notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const rowContent = (
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
                            e.preventDefault();
                            handleMarkAsRead(notification.id);
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
                          e.preventDefault();
                          deleteNotification.mutate(notification.id);
                        }}
                        className="p-1 text-text-tertiary hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );

                return link ? (
                  <Link
                    key={notification.id}
                    href={link}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 border-b border-ui-divider hover:bg-ui-muted transition-colors ${
                      !notification.isRead ? 'bg-brand-primary/5' : ''
                    }`}
                  >
                    {rowContent}
                  </Link>
                ) : (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-ui-divider hover:bg-ui-muted transition-colors ${
                      !notification.isRead ? 'bg-brand-primary/5' : ''
                    }`}
                  >
                    {rowContent}
                  </div>
                );
              })
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
