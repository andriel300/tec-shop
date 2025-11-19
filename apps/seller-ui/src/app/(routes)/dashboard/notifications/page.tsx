'use client';

import React, { useState } from 'react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '../../../../hooks/useNotifications';
import type { NotificationResponse } from '../../../../lib/api/notifications';

const NotificationsPage = () => {
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterRead, setFilterRead] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error } = useNotifications({
    type: filterType,
    isRead: filterRead,
    limit: 50,
  });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteNotificationMutation.mutateAsync(notificationId);
      } catch (err) {
        console.error('Failed to delete notification:', err);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <span className="text-2xl">&#10003;</span>;
      case 'ERROR':
        return <span className="text-2xl">&#10005;</span>;
      case 'WARNING':
        return <span className="text-2xl">&#9888;</span>;
      case 'ORDER':
        return <span className="text-2xl">&#128230;</span>;
      case 'PRODUCT':
        return <span className="text-2xl">&#128230;</span>;
      case 'SHOP':
        return <span className="text-2xl">&#127970;</span>;
      case 'SYSTEM':
        return <span className="text-2xl">&#9881;</span>;
      default:
        return <span className="text-2xl">&#9432;</span>;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-500/20 border-green-500/50';
      case 'ERROR':
        return 'bg-red-500/20 border-red-500/50';
      case 'WARNING':
        return 'bg-yellow-500/20 border-yellow-500/50';
      case 'ORDER':
        return 'bg-blue-500/20 border-blue-500/50';
      case 'PRODUCT':
        return 'bg-purple-500/20 border-purple-500/50';
      case 'SHOP':
        return 'bg-cyan-500/20 border-cyan-500/50';
      case 'SYSTEM':
        return 'bg-gray-500/20 border-gray-500/50';
      default:
        return 'bg-slate-500/20 border-slate-500/50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-white text-center py-8">Loading notifications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-400 text-center py-8">
          Error loading notifications: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data?.unreadCount || 0} unread notification{data?.unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={!data?.unreadCount || markAllAsReadMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All as Read'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value || undefined)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg"
        >
          <option value="">All Types</option>
          <option value="INFO">Info</option>
          <option value="SUCCESS">Success</option>
          <option value="WARNING">Warning</option>
          <option value="ERROR">Error</option>
          <option value="ORDER">Order</option>
          <option value="PRODUCT">Product</option>
          <option value="SHOP">Shop</option>
          <option value="SYSTEM">System</option>
        </select>

        <select
          value={filterRead === undefined ? '' : filterRead ? 'read' : 'unread'}
          onChange={(e) => {
            const value = e.target.value;
            setFilterRead(value === '' ? undefined : value === 'read');
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg"
        >
          <option value="">All Notifications</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {data?.data?.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 text-center">
            <p className="text-slate-400">No notifications found</p>
          </div>
        ) : (
          data?.data?.map((notification: NotificationResponse) => (
            <div
              key={notification.id}
              className={`rounded-lg p-6 border ${
                notification.isRead ? 'bg-slate-800/30 border-slate-700' : `${getNotificationColor(notification.type)}`
              } transition`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  notification.isRead ? 'bg-slate-700' : 'bg-slate-600'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {notification.title}
                        {!notification.isRead && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      notification.type === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                      notification.type === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                      notification.type === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                      notification.type === 'ORDER' ? 'bg-blue-500/20 text-blue-400' :
                      notification.type === 'PRODUCT' ? 'bg-purple-500/20 text-purple-400' :
                      notification.type === 'SHOP' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {notification.type}
                    </span>
                  </div>

                  <p className="text-slate-300 mb-4">{notification.message}</p>

                  <div className="flex gap-3">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      disabled={deleteNotificationMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
