'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../../contexts/auth-context';
import useSeller from '../../../../../hooks/useSeller';
import {
  useConversations,
  useMessages,
  useMarkConversationSeen,
  useUserOnlineStatus,
} from '../../../../../hooks/use-chat';
import { useChatSocket } from '../../../../../hooks/use-chat-socket';
import type { Conversation, ChatMessage } from '../../../../../lib/api/chat';
import { uploadChatImage } from '../../../../../lib/api/chat';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, MessageCircle, Users } from 'lucide-react';
import ChatInput from '../../../../../components/chats/chat-input';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';

const DEFAULT_AVATAR =
  'https://ik.imagekit.io/andrieltecshop/products/avatar.jpg?updatedAt=1763005913773';

const InboxPage = () => {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { seller, isLoading: sellerLoading } = useSeller();
  const router = useRouter();
  const queryClient = useQueryClient();
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<{
    conversationId: string;
    userId: string;
  } | null>(null);
  const [isSendingImage, setIsSendingImage] = useState(false);

  const conversationIdFromUrl = searchParams.get('conversationId');

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations(1, 50, isAuthenticated);

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    selectedConversation?.id || '',
    1,
    50,
    !!selectedConversation
  );

  // Mark conversation as seen mutation
  const markSeenMutation = useMarkConversationSeen();

  // Check if the selected conversation's other participant is online
  const { data: onlineStatus } = useUserOnlineStatus(
    selectedConversation?.otherParticipant?.id || '',
    !!selectedConversation
  );
  const isOtherParticipantOnline = onlineStatus?.isOnline ?? false;

  // Handle incoming messages from WebSocket
  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      if (message.conversationId === selectedConversation?.id) {
        setLocalMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        // Scroll to bottom
        setTimeout(() => {
          scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    [selectedConversation?.id, queryClient]
  );

  // Handle typing indicator
  const handleTyping = useCallback(
    (data: {
      conversationId: string;
      userId: string;
      userType: string;
      isTyping: boolean;
    }) => {
      if (
        data.conversationId === selectedConversation?.id &&
        data.userId !== seller?.id
      ) {
        if (data.isTyping) {
          setIsTyping({
            conversationId: data.conversationId,
            userId: data.userId,
          });
          // Auto-clear after 3 seconds
          setTimeout(() => setIsTyping(null), 3000);
        } else {
          setIsTyping(null);
        }
      }
    },
    [selectedConversation?.id, seller?.id]
  );

  // WebSocket connection
  const {
    isConnected,
    isConnecting,
    connectionError,
    joinConversation,
    leaveConversation,
    sendMessage: sendWsMessage,
    sendTyping,
    markAsSeen,
    reconnect,
  } = useChatSocket({
    enabled: isAuthenticated,
    onMessage: handleNewMessage,
    onTyping: handleTyping,
  });

  // Select conversation from URL param
  useEffect(() => {
    if (conversationIdFromUrl && conversationsData?.conversations) {
      const conversation = conversationsData.conversations.find(
        (c) => c.id === conversationIdFromUrl
      );
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [conversationIdFromUrl, conversationsData]);

  // Extract conversation ID to avoid dependency array size changes
  const selectedConversationId = selectedConversation?.id ?? null;

  // Track which conversation we've marked as seen to avoid duplicate calls
  const markedSeenRef = useRef<string | null>(null);

  // Join/leave conversation room when selected conversation changes
  useEffect(() => {
    if (selectedConversationId && isConnected) {
      joinConversation(selectedConversationId);

      // Only mark as seen once per conversation selection
      if (markedSeenRef.current !== selectedConversationId) {
        markedSeenRef.current = selectedConversationId;
        markAsSeen(selectedConversationId);
        markSeenMutation.mutate(selectedConversationId);
      }

      return () => {
        leaveConversation(selectedConversationId);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedConversationId,
    isConnected,
    joinConversation,
    leaveConversation,
    markAsSeen,
  ]);

  // Reset markedSeenRef when conversation changes
  useEffect(() => {
    if (!selectedConversationId) {
      markedSeenRef.current = null;
    }
  }, [selectedConversationId]);

  // Sync messages from API to local state
  useEffect(() => {
    if (messagesData?.messages) {
      setLocalMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLocalMessages([]);
    router.push(`/dashboard/inbox?conversationId=${conversation.id}`, {
      scroll: false,
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Loading state
  if (authLoading || sellerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <MessageCircle size={48} className="text-gray-500" />
        <p className="text-gray-500">Please log in to view your messages</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <Users size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Customer Messages
          </h1>
        </div>
        <p className="text-gray-500 text-sm pl-1">
          Chat with your customers in real-time
        </p>
      </div>

      <div className="flex h-[calc(100vh-210px)] rounded-xl overflow-hidden border border-surface-container-highest bg-surface-container-lowest shadow-sm">
        {/* Conversations List */}
        <div
          className={`${
            selectedConversation ? 'hidden md:flex' : 'flex'
          } flex-col w-full md:w-[300px] border-r border-surface-container-highest bg-surface-container flex-shrink-0`}
        >
          {/* Sidebar header */}
          <div className="px-4 py-3.5 border-b border-surface-container-highest">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle size={16} className="text-brand-primary" />
                Conversations
              </h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-xs text-feedback-success">
                  <span className="w-1.5 h-1.5 bg-feedback-success rounded-full" />
                  Live
                </span>
              ) : isConnecting ? (
                <span className="inline-flex items-center gap-1 text-xs text-feedback-warning">
                  <span className="w-1.5 h-1.5 bg-feedback-warning rounded-full animate-pulse" />
                  Connecting
                </span>
              ) : connectionError ? (
                <button
                  onClick={reconnect}
                  className="text-xs text-feedback-error flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 bg-feedback-error rounded-full" />
                  Retry
                </button>
              ) : null}
            </div>
          </div>

          {/* Conversation items */}
          <div className="overflow-y-auto flex-1">
            {conversationsLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-surface-container-highest rounded w-3/4" />
                      <div className="h-2.5 bg-surface-container-highest rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationsError ? (
              <div className="p-6 text-center">
                <p className="text-sm text-feedback-error">
                  Failed to load conversations
                </p>
              </div>
            ) : !conversationsData?.conversations?.length ? (
              <div className="p-8 text-center">
                <div className="p-3 bg-surface-container rounded-full w-fit mx-auto mb-3">
                  <MessageCircle size={28} className="text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900">No conversations yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Customer messages will appear here
                </p>
              </div>
            ) : (
              conversationsData.conversations.map((conversation) => {
                const isActive = selectedConversation?.id === conversation.id;
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left px-4 py-3 transition-colors duration-150 cursor-pointer border-l-[3px] ${
                      isActive
                        ? 'bg-brand-primary/10 border-brand-primary'
                        : 'border-transparent hover:bg-surface-container-highest'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={
                            conversation.otherParticipant.avatar ||
                            DEFAULT_AVATAR
                          }
                          alt={conversation.otherParticipant.name}
                          width={40}
                          height={40}
                          className="rounded-full w-10 h-10 object-cover"
                        />
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 bg-feedback-error text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center leading-none px-1">
                            {conversation.unreadCount > 9
                              ? '9+'
                              : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm truncate ${
                              hasUnread
                                ? 'font-semibold text-gray-900'
                                : 'font-medium text-gray-900'
                            }`}
                          >
                            {conversation.otherParticipant.name}
                          </span>
                          {conversation.lastMessage && (
                            <span className="text-[11px] text-gray-500 flex-shrink-0">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            hasUnread
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {conversation.lastMessage?.content ||
                            'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`${
            selectedConversation ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col min-w-0`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-surface-container-highest flex items-center gap-3 bg-surface-container-lowest flex-shrink-0">
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    router.push('/dashboard/inbox', { scroll: false });
                  }}
                  className="md:hidden p-1.5 hover:bg-surface-container rounded-full text-gray-500 cursor-pointer transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="relative flex-shrink-0">
                  <Image
                    src={
                      selectedConversation.otherParticipant.avatar ||
                      DEFAULT_AVATAR
                    }
                    alt={selectedConversation.otherParticipant.name}
                    width={38}
                    height={38}
                    className="rounded-full w-[38px] h-[38px] object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-container-lowest ${
                      isOtherParticipantOnline
                        ? 'bg-feedback-success'
                        : 'bg-gray-500'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {selectedConversation.otherParticipant.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isOtherParticipantOnline ? (
                      <span className="text-feedback-success font-medium">Online</span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
              >
                {messagesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary" />
                  </div>
                ) : localMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="p-4 bg-surface-container rounded-full">
                      <MessageCircle size={32} className="text-gray-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">
                        No messages yet
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Send a message to start the conversation
                      </p>
                    </div>
                  </div>
                ) : (
                  localMessages.map((message) => {
                    const isOwnMessage = message.senderType === 'seller';
                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* Avatar for received messages */}
                        {!isOwnMessage && (
                          <Image
                            src={
                              selectedConversation.otherParticipant.avatar ||
                              DEFAULT_AVATAR
                            }
                            alt={selectedConversation.otherParticipant.name}
                            width={28}
                            height={28}
                            className="rounded-full w-7 h-7 object-cover flex-shrink-0 mb-0.5"
                          />
                        )}
                        <div
                          className={`max-w-[65%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                            isOwnMessage
                              ? 'bg-brand-primary text-white rounded-br-md'
                              : 'bg-surface-container-lowest text-gray-900 rounded-bl-md border border-surface-container-highest'
                          }`}
                        >
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {message.attachments.map((att, idx) => (
                                  <a
                                    key={`att-${message.id}-${idx}`}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Image
                                      src={att.url}
                                      alt={`Attachment ${idx + 1}`}
                                      width={200}
                                      height={200}
                                      className="rounded-xl max-w-[200px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                          {message.content && (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {message.content}
                            </p>
                          )}
                          <p
                            className={`text-[11px] mt-1 ${
                              isOwnMessage
                                ? 'text-white/60 text-right'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Image uploading indicator */}
                {isSendingImage && (
                  <div className="flex items-end justify-end gap-2">
                    <div className="bg-brand-primary/60 rounded-2xl rounded-br-md px-3.5 py-2.5 flex items-center gap-2 text-white text-sm shadow-sm">
                      <Loader2 size={13} className="animate-spin" />
                      Uploading...
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {isTyping &&
                  isTyping.conversationId === selectedConversation.id && (
                    <div className="flex items-end gap-2 justify-start">
                      <Image
                        src={
                          selectedConversation.otherParticipant.avatar ||
                          DEFAULT_AVATAR
                        }
                        alt={selectedConversation.otherParticipant.name}
                        width={28}
                        height={28}
                        className="rounded-full w-7 h-7 object-cover flex-shrink-0 mb-0.5"
                      />
                      <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                          <span
                            className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.15s' }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.3s' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                <div ref={scrollAnchorRef} />
              </div>

              {/* Message Input */}
              <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={async (message, attachments) => {
                  if (!selectedConversation) return;

                  let uploadedAttachments:
                    | { url: string; type?: string }[]
                    | undefined;

                  if (attachments && attachments.length > 0) {
                    setIsSendingImage(true);
                    try {
                      const uploads = await Promise.all(
                        attachments.map((att) => uploadChatImage(att.file))
                      );
                      uploadedAttachments = uploads.map((u) => ({
                        url: u.url,
                        type: 'image',
                      }));
                    } catch (_err) {
                      toast.error('Failed to upload image. Please try again.');
                      setIsSendingImage(false);
                      return;
                    }
                    setIsSendingImage(false);
                  }

                  sendWsMessage(
                    selectedConversation.id,
                    message,
                    uploadedAttachments
                  );
                  setNewMessage('');
                  sendTyping(selectedConversation.id, false);
                }}
                onTyping={(typing) => {
                  if (selectedConversation) {
                    sendTyping(selectedConversation.id, typing);
                  }
                }}
                disabled={!isConnected || isSendingImage}
                isConnecting={!isConnected}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="p-5 bg-surface-container rounded-full">
                <MessageCircle size={36} className="text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-900">
                  Select a conversation
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Choose from your customer conversations on the left
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function InboxPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
        </div>
      }
    >
      <InboxPage />
    </Suspense>
  );
}
