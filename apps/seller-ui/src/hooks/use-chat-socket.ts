import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '../lib/api/chat';
import { getWebSocketToken } from '../lib/api/chat';

interface UseChatSocketOptions {
  enabled?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (data: {
    conversationId: string;
    userId: string;
    userType: string;
    isTyping: boolean;
  }) => void;
  onMessagesSeen?: (data: {
    conversationId: string;
    userId: string;
    seenAt: string;
  }) => void;
  onError?: (error: { message: string }) => void;
}

interface UseChatSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, attachments?: { url: string; type?: string }[]) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  markAsSeen: (conversationId: string) => void;
  reconnect: () => void;
}

export const useChatSocket = ({
  enabled = true,
  onMessage,
  onTyping,
  onMessagesSeen,
  onError,
}: UseChatSocketOptions): UseChatSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const tokenExpiryRef = useRef<number>(0);
  const isConnectingRef = useRef(false);
  const queryClient = useQueryClient();

  // Store callbacks in refs to avoid reconnection on callback changes
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onMessagesSeenRef = useRef(onMessagesSeen);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    onMessagesSeenRef.current = onMessagesSeen;
  }, [onMessagesSeen]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Get WebSocket URL - Socket.IO uses http:// for initial handshake, then upgrades to WebSocket
  const getWsUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    if (process.env.NODE_ENV === 'production') {
      const wsProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${wsProtocol}//${window.location.host}`;
    }
    return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:6007';
  }, []);

  // Fetch WebSocket token
  const fetchToken = useCallback(async (): Promise<string | null> => {
    // Return cached token if still valid (with 30 second buffer)
    if (tokenRef.current && Date.now() < tokenExpiryRef.current - 30000) {
      return tokenRef.current;
    }

    try {
      const { token, expiresIn } = await getWebSocketToken();
      tokenRef.current = token;
      tokenExpiryRef.current = Date.now() + expiresIn * 1000;
      return token;
    } catch (error) {
      console.error('Failed to fetch WebSocket token:', error);
      setConnectionError('Failed to authenticate');
      return null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    // Use ref to prevent race conditions with state
    if (socketRef.current?.connected || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);

    const token = await fetchToken();
    if (!token) {
      isConnectingRef.current = false;
      setIsConnecting(false);
      return;
    }

    const wsUrl = getWsUrl();
    if (!wsUrl) {
      isConnectingRef.current = false;
      setIsConnecting(false);
      return;
    }

    // Create socket connection with auth
    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      isConnectingRef.current = false;
      setIsConnecting(false);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('WebSocket connected:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      isConnectingRef.current = false;
      setIsConnecting(false);
      setConnectionError('Connection failed');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      onErrorRef.current?.(error);
      if (error.message === 'Invalid or expired token') {
        // Clear token and try to reconnect
        tokenRef.current = null;
        tokenExpiryRef.current = 0;
      }
    });

    // Chat events - use refs to get latest callbacks
    socket.on('chat_message', (message: ChatMessage) => {
      onMessageRef.current?.(message);
      // Invalidate messages query to update the list
      queryClient.invalidateQueries({
        queryKey: ['messages', message.conversationId],
      });
      // Update conversations list to show new last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('user_typing', (data) => {
      onTypingRef.current?.(data);
    });

    socket.on('messages_seen', (data) => {
      onMessagesSeenRef.current?.(data);
    });

    socket.on('joined_conversation', (data) => {
      console.log('Joined conversation:', data.conversationId);
    });

    socket.on('left_conversation', (data) => {
      console.log('Left conversation:', data.conversationId);
    });

    socket.on('message_sent', (data) => {
      console.log('Message queued:', data);
    });
  }, [fetchToken, getWsUrl, queryClient]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, []);

  // Connect on mount, disconnect on unmount
  // Use a separate effect with minimal dependencies to avoid reconnection loops
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Small delay to allow React StrictMode double-mount to settle
    const timeoutId = setTimeout(() => {
      if (!socketRef.current?.connected && !isConnectingRef.current) {
        connect();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      // Only disconnect on actual unmount, not on re-renders
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        isConnectingRef.current = false;
      }
    };
  }, [enabled, connect]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  }, []);

  const sendMessage = useCallback(
    (conversationId: string, content: string, attachments?: { url: string; type?: string }[]) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          conversationId,
          content,
          ...(attachments && attachments.length > 0 && { attachments }),
        });
      }
    },
    []
  );

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('typing', { conversationId, isTyping });
      }
    },
    []
  );

  const markAsSeen = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_as_seen', { conversationId });
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    // Clear token to force refetch
    tokenRef.current = null;
    tokenExpiryRef.current = 0;
    connect();
  }, [disconnect, connect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connectionError,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markAsSeen,
    reconnect,
  };
};

export default useChatSocket;
