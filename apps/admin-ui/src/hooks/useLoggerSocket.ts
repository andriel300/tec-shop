'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { LogEntry, LogLevel, LogCategory } from '../lib/api/logs';

export interface LogSubscriptionFilters {
  services?: string[];
  levels?: LogLevel[];
  categories?: LogCategory[];
}

interface UseLoggerSocketOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  onLog?: (log: LogEntry) => void;
  filters?: LogSubscriptionFilters;
}

interface UseLoggerSocketReturn {
  isConnected: boolean;
  logs: LogEntry[];
  clearLogs: () => void;
  subscribe: (filters?: LogSubscriptionFilters) => void;
  unsubscribe: () => void;
  updateFilters: (filters: LogSubscriptionFilters) => void;
  isPaused: boolean;
  togglePause: () => void;
}

const LOGGER_WS_URL =
  process.env.NEXT_PUBLIC_LOGGER_WS_URL || 'http://localhost:6008';
const MAX_LOGS = 500;

export function useLoggerSocket(
  options: UseLoggerSocketOptions = {}
): UseLoggerSocketReturn {
  const {
    enabled = true,
    onConnect,
    onDisconnect,
    onError,
    onLog,
    filters: initialFilters,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isPausedRef = useRef(isPaused);

  isPausedRef.current = isPaused;

  const getAuthToken = useCallback((): string | null => {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'admin_access_token' || name === 'access_token') {
        return decodeURIComponent(value);
      }
    }

    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) {
      try {
        const user = JSON.parse(sessionUser);
        return user.token || null;
      } catch {
        return null;
      }
    }

    return null;
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const subscribe = useCallback((filters?: LogSubscriptionFilters) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { filters });
    }
  }, []);

  const unsubscribe = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', {});
    }
  }, []);

  const updateFilters = useCallback((filters: LogSubscriptionFilters) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update_filters', { filters });
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const token = getAuthToken();

    const socket = io(LOGGER_WS_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      onConnect?.();

      socket.emit('subscribe', { filters: initialFilters });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('error', (data: { message: string }) => {
      onError?.(data.message);
    });

    socket.on('connected', (data: { adminId: string }) => {
      console.log('Logger socket connected as admin:', data.adminId);
    });

    socket.on('subscribed', (data: { recentLogs?: LogEntry[] }) => {
      if (data.recentLogs?.length) {
        setLogs(data.recentLogs.slice(0, MAX_LOGS));
      }
    });

    socket.on('log_entry', (log: LogEntry) => {
      if (isPausedRef.current) return;

      setLogs((prev) => {
        const newLogs = [log, ...prev];
        return newLogs.slice(0, MAX_LOGS);
      });
      onLog?.(log);
    });

    socket.on('connect_error', (error) => {
      console.error('Logger socket connection error:', error.message);
      onError?.(error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    enabled,
    getAuthToken,
    onConnect,
    onDisconnect,
    onError,
    onLog,
    initialFilters,
  ]);

  return {
    isConnected,
    logs,
    clearLogs,
    subscribe,
    unsubscribe,
    updateFilters,
    isPaused,
    togglePause,
  };
}
