'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../../../../hooks/use-notifications';
import type { NotificationType } from '../../../../lib/api/notifications';

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
  INFO: 'bg-blue-100 text-blue-700 border-blue-200',
  SUCCESS: 'bg-green-100 text-green-700 border-green-200',
  WARNING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ERROR: 'bg-red-100 text-red-700 border-red-200',
  ORDER: 'bg-purple-100 text-purple-700 border-purple-200',
  PRODUCT: 'bg-pink-100 text-pink-700 border-pink-200',
  SHOP: 'bg-orange-100 text-orange-700 border-orange-200',
  SYSTEM: 'bg-gray-100 text-gray-700 border-gray-200',
  AUTH: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  DELIVERY: 'bg-teal-100 text-teal-700 border-teal-200',
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

const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [filterRead, setFilterRead] = useState<string>('');

  const { data, isLoading } = useNotifications({
    page,
    limit: 20,
    type: filterType || undefined,
    isRead: filterRead || undefined,
  });

  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="w-[90%] lg:w-[80%] mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">
          Notifications
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Stay updated with your orders, deliveries, and account activity
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          className="px-4 py-2.5 border border-ui-divider rounded-lg text-text-primary bg-ui-surface outline-none focus:border-brand-primary"
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
          className="px-4 py-2.5 border border-ui-divider rounded-lg text-text-primary bg-ui-surface outline-none focus:border-brand-primary"
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
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-800 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <CheckCheck size={16} />
            Mark all as read ({data.unreadCount})
          </button>
        )}
      </div>

      <div className="bg-ui-surface rounded-lg border border-ui-divider overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
          </div>
        ) : !data?.notifications?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Bell size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-1 text-text-tertiary">
              {filterType || filterRead
                ? 'Try adjusting your filters'
                : 'You will see notifications here when events occur'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ui-divider">
            {data.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-ui-muted transition-colors flex items-start gap-4 ${
                  !notification.isRead ? 'bg-brand-primary/5' : ''
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
                    <p className="text-text-primary font-medium text-sm">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-text-secondary text-sm mt-1">
                    {notification.message}
                  </p>
                  <p className="text-text-tertiary text-xs mt-2">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead.mutate(notification.id)}
                      className="p-2 text-text-tertiary hover:text-brand-primary transition-colors rounded-lg hover:bg-ui-muted"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification.mutate(notification.id)}
                    className="p-2 text-text-tertiary hover:text-red-500 transition-colors rounded-lg hover:bg-ui-muted"
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
          <div className="bg-ui-muted px-6 py-4 flex items-center justify-between border-t border-ui-divider">
            <span className="text-sm text-text-secondary">
              Page {page} of {totalPages} ({data?.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 bg-ui-surface border border-ui-divider hover:bg-ui-muted disabled:opacity-50 disabled:cursor-not-allowed text-text-primary rounded-lg transition-colors flex items-center gap-1 text-sm"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 bg-ui-surface border border-ui-divider hover:bg-ui-muted disabled:opacity-50 disabled:cursor-not-allowed text-text-primary rounded-lg transition-colors flex items-center gap-1 text-sm"
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
