'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  useNotificationsV2,
  useMarkAsReadV2,
  useMarkAllAsReadV2,
  useDeleteNotificationV2,
  notificationV2Keys,
} from '../hooks/use-notifications-v2';
import { useNotificationSocket } from '../hooks/use-notification-socket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../hooks/use-auth';
import { createPortal } from 'react-dom';

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

export function NotificationBellV2() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data } = useNotificationsV2({ limit: 10 });
  const markAsRead = useMarkAsReadV2();
  const markAllRead = useMarkAllAsReadV2();
  const deleteNotification = useDeleteNotificationV2();

  const { unreadCount } = useNotificationSocket({
    enabled: !!isAuthenticated,
    onNotification: (notification) => {
      toast(notification.title, { description: notification.message });
      queryClient.invalidateQueries({ queryKey: notificationV2Keys.all });
    },
  });

  const displayCount = unreadCount || data?.unreadCount || 0;

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
      >
        <Bell size={20} />
        {displayCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {displayCount > 99 ? '99+' : displayCount}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 9999,
            }}
            className="w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-[480px] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-semibold text-sm">
                Notifications
              </h3>
              {displayCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {!data?.notifications?.length ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                data.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                      !notification.isRead ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          typeColors[notification.type] || 'bg-gray-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
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
                            className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
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
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
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
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center text-sm text-blue-400 hover:text-blue-300 border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
            >
              View all notifications
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}
