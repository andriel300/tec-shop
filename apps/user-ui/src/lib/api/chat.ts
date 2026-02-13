import { apiClient } from './client';

// Chat types
export type ParticipantType = 'user' | 'seller';

export interface ParticipantInfo {
  id: string;
  type: ParticipantType;
  name: string;
  avatar?: string;
}

export interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  otherParticipant: ParticipantInfo;
  lastMessage?: LastMessage;
  unreadCount: number;
  createdAt: string;
  lastSeenAt?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  attachments?: { url: string; type?: string }[];
  createdAt: string;
  updatedAt?: string;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateConversationParams {
  targetId: string;
  targetType: ParticipantType;
  initialMessage?: string;
}

// API Functions

/**
 * Create a new conversation with a seller
 */
export const createConversation = async (
  params: CreateConversationParams
): Promise<Conversation> => {
  const response = await apiClient.post('/chat/conversations', params);
  return response.data;
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (
  page = 1,
  limit = 20
): Promise<ConversationsResponse> => {
  const response = await apiClient.get('/chat/conversations', {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation> => {
  const response = await apiClient.get(`/chat/conversations/${conversationId}`);
  return response.data;
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 20
): Promise<MessagesResponse> => {
  const response = await apiClient.get(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page, limit } }
  );
  return response.data;
};

/**
 * Mark conversation as seen/read
 */
export const markConversationSeen = async (
  conversationId: string
): Promise<{ status: string }> => {
  const response = await apiClient.post(
    `/chat/conversations/${conversationId}/seen`
  );
  return response.data;
};

/**
 * Check if a user is online
 */
export const checkUserOnline = async (
  userId: string
): Promise<{ isOnline: boolean }> => {
  const response = await apiClient.get(`/chat/online/${userId}`);
  return response.data;
};

/**
 * Get a short-lived WebSocket token for real-time chat
 */
export const getWebSocketToken = async (): Promise<{
  token: string;
  expiresIn: number;
}> => {
  const response = await apiClient.get('/chat/ws-token');
  return response.data;
};

/**
 * Upload an image for chat attachment via ImageKit
 */
export const uploadChatImage = async (
  file: File
): Promise<{ url: string; fileId: string; name: string; size: number }> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post('/chat/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// WebSocket URL helper - Socket.IO uses http:// for initial handshake
export const getWebSocketUrl = (): string => {
  if (process.env.NODE_ENV === 'production') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.host}`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:6007';
};
