'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { NotificationEntry } from '../lib/api/notifications';

interface UseNotificationSocketOptions {
  enabled?: boolean;
  onNotification?: (notification: NotificationEntry) => void;
}

interface UseNotificationSocketReturn {
  isConnected: boolean;
  unreadCount: number;
}

const NOTIFICATION_WS_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL || 'http://localhost:6012';

export function useNotificationSocket(
  options: UseNotificationSocketOptions = {}
): UseNotificationSocketReturn {
  const { enabled = true, onNotification } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    if (!enabled) return;

    const socket = io(NOTIFICATION_WS_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connected', (data: { unreadCount?: number }) => {
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    });

    socket.on('notification', (notification: NotificationEntry) => {
      setUnreadCount((prev) => prev + 1);
      onNotificationRef.current?.(notification);
    });

    socket.on('unread_count', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    socket.on('connect_error', (error) => {
      console.error('Notification socket error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return {
    isConnected,
    unreadCount,
  };
}
