'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  useNotificationsV2,
  useMarkAsReadV2,
  useMarkAllAsReadV2,
  useDeleteNotificationV2,
} from '../../../../../hooks/use-notifications-v2';
import type {
  NotificationType,
  NotificationEntry,
} from '../../../../../lib/api/notifications-v2';

const USER_UI_URL = process.env.NEXT_PUBLIC_USER_UI_URL;

function getNotificationLink(notification: NotificationEntry): string | null {
  const metadata = notification.metadata;
  if (!metadata) return null;

  const productSlug = metadata.productSlug as string | undefined;
  if (productSlug) {
    return `${USER_UI_URL}/product/${productSlug}`;
  }

  return null;
}

const NOTIFICATION_TYPES: NotificationType[] = [
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR',
  'ORDER',
  'PRODUCT',
  'SHOP',
  'SYSTEM',
  'AUTH',
  'DELIVERY',
];

const typeColors: Record<string, string> = {
  INFO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SUCCESS: 'bg-green-500/20 text-green-400 border-green-500/30',
  WARNING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ERROR: 'bg-red-500/20 text-red-400 border-red-500/30',
  ORDER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  PRODUCT: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  SHOP: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  SYSTEM: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  AUTH: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  DELIVERY: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
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

const ITEMS_PER_PAGE = 20;

const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [filterRead, setFilterRead] = useState<string>('');

  const { data, isLoading } = useNotificationsV2({
    page,
    limit: ITEMS_PER_PAGE,
    type: filterType || undefined,
    isRead: filterRead || undefined,
  });

  const markAsRead = useMarkAsReadV2();
  const markAllRead = useMarkAllAsReadV2();
  const deleteNotification = useDeleteNotificationV2();

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-6">
        <h2 className="text-2xl text-white font-semibold mb-1">
          Notifications
        </h2>
        <p className="text-slate-400 text-sm">
          Stay updated with orders, reviews, and shop activity
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <select
          className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as NotificationType | '');
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          {NOTIFICATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none"
          value={filterRead}
          onChange={(e) => {
            setFilterRead(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>

        {data && data.unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <CheckCheck size={16} />
            Mark all as read ({data.unreadCount})
          </button>
        )}
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : !data?.notifications?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Bell size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-1">
              {filterType || filterRead
                ? 'Try adjusting your filters'
                : 'You will see notifications here when events occur'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {data.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-slate-800/50 transition-colors flex items-start gap-4 ${
                  !notification.isRead ? 'bg-slate-800/20' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${
                      typeColors[notification.type] || typeColors.INFO
                    }`}
                  >
                    {notification.type}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-slate-500 text-xs">
                      {timeAgo(notification.createdAt)}
                    </p>
                    {getNotificationLink(notification) && (
                      <a
                        href={getNotificationLink(notification) as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        View Product
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead.mutate(notification.id)}
                      className="p-2 text-slate-500 hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-700"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification.mutate(notification.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-t border-slate-700">
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages} ({data?.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
