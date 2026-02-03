import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  getConversations,
  getConversation,
  getMessages,
  createConversation,
  markConversationSeen,
  checkUserOnline,
  type Conversation,
  type ConversationsResponse,
  type MessagesResponse,
  type CreateConversationParams,
} from '../lib/api/chat';

/**
 * Hook to get all conversations for the current seller
 */
export const useConversations = (
  page = 1,
  limit = 20,
  enabled = true
): UseQueryResult<ConversationsResponse, Error> => {
  return useQuery({
    queryKey: ['conversations', page, limit],
    queryFn: () => getConversations(page, limit),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to get a single conversation by ID
 */
export const useConversation = (
  conversationId: string,
  enabled = true
): UseQueryResult<Conversation, Error> => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: enabled && !!conversationId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to get messages for a conversation
 */
export const useMessages = (
  conversationId: string,
  page = 1,
  limit = 20,
  enabled = true
): UseQueryResult<MessagesResponse, Error> => {
  return useQuery({
    queryKey: ['messages', conversationId, page, limit],
    queryFn: () => getMessages(conversationId, page, limit),
    enabled: enabled && !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
  });
};

/**
 * Hook to create a new conversation
 */
export const useCreateConversation = (): UseMutationResult<
  Conversation,
  Error,
  CreateConversationParams
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

/**
 * Hook to mark a conversation as seen
 */
export const useMarkConversationSeen = (): UseMutationResult<
  { status: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markConversationSeen,
    onSuccess: (_data, conversationId) => {
      // Invalidate the specific conversation and conversations list
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

/**
 * Hook to check if a user is online
 */
export const useUserOnlineStatus = (
  userId: string,
  enabled = true
): UseQueryResult<{ isOnline: boolean }, Error> => {
  return useQuery({
    queryKey: ['userOnline', userId],
    queryFn: () => checkUserOnline(userId),
    enabled: enabled && !!userId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
