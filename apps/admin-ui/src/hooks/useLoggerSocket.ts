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

  // Store callbacks in refs to avoid reconnection on callback identity changes
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  const onLogRef = useRef(onLog);
  const filtersRef = useRef(initialFilters);

  isPausedRef.current = isPaused;
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  onErrorRef.current = onError;
  onLogRef.current = onLog;
  filtersRef.current = initialFilters;

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

  // Socket connection effect - only depends on `enabled` to prevent reconnection loops
  // Callbacks are accessed via refs so they always use the latest version
  useEffect(() => {
    if (!enabled) return;

    const socket = io(LOGGER_WS_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      onConnectRef.current?.();
      socket.emit('subscribe', { filters: filtersRef.current });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnectRef.current?.();
    });

    socket.on('error', (data: { message: string }) => {
      onErrorRef.current?.(data.message);
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
      onLogRef.current?.(log);
    });

    socket.on('connect_error', (error) => {
      console.error('Logger socket connection error:', error.message);
      onErrorRef.current?.(error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

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
