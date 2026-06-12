'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  MessageSquare,
  CreditCard,
  Truck,
  PackageCheck,
  Package,
  XCircle,
  Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from '../../i18n/navigation';
import { useRouter } from '../../i18n/navigation';
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
import { useTranslations } from 'next-intl';
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

type TFunc = ReturnType<typeof useTranslations<'Navbar'>>;

function timeAgo(dateStr: string, t: TFunc): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('justNow');
  if (minutes < 60) return t('minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('daysAgo', { count: days });
}

function getNotificationLink(notification: NotificationEntry): string | null {
  const { templateId, metadata } = notification;

  if (templateId === 'chat.new_message') {
    const conversationId = metadata?.conversationId as string | undefined;
    if (conversationId) return `/inbox?conversationId=${conversationId}`;
  }

  if (templateId?.startsWith('order.')) {
    const orderId = metadata?.orderId as string | undefined;
    if (orderId) return `/orders/${orderId}`;
  }

  return null;
}

function getTranslatedContent(
  notification: NotificationEntry,
  t: TFunc
): { title: string; message: string } {
  const { templateId, title, message, metadata } = notification;
  const meta = (metadata ?? {}) as Record<string, string>;

  switch (templateId) {
    case 'order.paid':
      return {
        title: t('notifOrderPaidTitle'),
        message: meta.orderNumber
          ? t('notifOrderPaidMessage', { orderNumber: meta.orderNumber })
          : message,
      };
    case 'order.shipped':
      return {
        title: t('notifOrderShippedTitle'),
        message: meta.orderNumber
          ? t('notifOrderShippedMessage', {
              orderNumber: meta.orderNumber,
              trackingNumber: (meta.trackingNumber as string | undefined) ?? 'N/A',
            })
          : message,
      };
    case 'order.delivered':
      return {
        title: t('notifOrderDeliveredTitle'),
        message: meta.orderNumber
          ? t('notifOrderDeliveredMessage', { orderNumber: meta.orderNumber })
          : message,
      };
    case 'order.delivered_review':
      return { title: t('notifOrderDeliveredReviewTitle'), message };
    case 'order.cancelled':
      return {
        title: t('notifOrderCancelledTitle'),
        message: meta.orderNumber
          ? t('notifOrderCancelledMessage', { orderNumber: meta.orderNumber })
          : message,
      };
    case 'chat.new_message':
      return { title: t('notifChatNewMessageTitle'), message };
    default:
      return { title, message };
  }
}

function getNotificationActionText(templateId: string | undefined, t: TFunc): string | null {
  if (!templateId) return null;
  if (templateId === 'chat.new_message') return t('openConversation');
  if (templateId.startsWith('order.')) return t('viewOrder');
  return null;
}

interface TemplateIconConfig {
  Icon: LucideIcon;
  bg: string;
  color: string;
}

function getTemplateIconConfig(templateId: string | undefined): TemplateIconConfig | null {
  switch (templateId) {
    case 'order.paid':
      return { Icon: CreditCard, bg: 'bg-green-100', color: 'text-green-600' };
    case 'order.shipped':
      return { Icon: Truck, bg: 'bg-teal-100', color: 'text-teal-600' };
    case 'order.delivered':
    case 'order.delivered_review':
      return { Icon: PackageCheck, bg: 'bg-teal-100', color: 'text-teal-600' };
    case 'order.placed':
      return { Icon: Package, bg: 'bg-purple-100', color: 'text-purple-600' };
    case 'order.cancelled':
      return { Icon: XCircle, bg: 'bg-red-100', color: 'text-red-500' };
    case 'chat.new_message':
      return { Icon: MessageSquare, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'product.new_rating':
      return { Icon: Star, bg: 'bg-yellow-100', color: 'text-yellow-500' };
    default:
      return null;
  }
}

function NotificationToast({
  notification,
  link,
  onClose,
  t,
}: {
  notification: NotificationEntry;
  link: string | null;
  onClose: () => void;
  t: TFunc;
}) {
  const router = useRouter();
  const borderColor = typeBorders[notification.type] || 'border-l-gray-500';
  const iconConfig = getTemplateIconConfig(notification.templateId);
  const actionText = getNotificationActionText(notification.templateId, t);
  const { title: notifTitle, message: notifMessage } = getTranslatedContent(notification, t);

  const handleBodyClick = () => {
    if (link) {
      router.push(link);
      onClose();
    }
  };

  return (
    <div
      className={`flex items-start gap-3 bg-white border border-gray-200 border-l-4 ${borderColor} rounded-[10px] shadow-[0_4px_8px_rgba(15,23,36,0.08)] p-3.5 w-[360px] max-w-[calc(100vw-32px)]`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          iconConfig ? iconConfig.bg : 'bg-gray-100'
        }`}
      >
        {iconConfig ? (
          <iconConfig.Icon size={14} className={iconConfig.color} />
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
          {notifTitle}
        </p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
          {notifMessage}
        </p>
        {link && actionText && (
          <p className="text-xs text-blue-600 mt-1.5 font-medium flex items-center gap-1">
            <span>{actionText}</span>
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
  const t = useTranslations('Navbar');
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
            t={t}
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
              {t('notifications')}
            </h3>
            {displayCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-primary hover:text-brand-primary-800 flex items-center gap-1"
              >
                <CheckCheck size={14} />
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {!data?.notifications?.length ? (
              <div className="px-4 py-8 text-center text-text-secondary text-sm">
                {t('noNotificationsYet')}
              </div>
            ) : (
              data.notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const iconConfig = getTemplateIconConfig(notification.templateId);
                const { title: notifTitle, message: notifMessage } = getTranslatedContent(notification, t);
                const rowContent = (
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        iconConfig ? iconConfig.bg : 'bg-gray-100'
                      }`}
                    >
                      {iconConfig ? (
                        <iconConfig.Icon size={13} className={iconConfig.color} />
                      ) : (
                        <div
                          className={`w-2 h-2 rounded-full ${typeColors[notification.type] || 'bg-gray-500'}`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {notifTitle}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {notifMessage}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {timeAgo(notification.createdAt, t)}
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
                          title={t('markAsRead')}
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
                        title={t('delete')}
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
            {t('viewAllNotifications')}
          </Link>
        </div>
      )}
    </div>
  );
}
