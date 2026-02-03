'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/use-auth';
import {
  useConversations,
  useMessages,
  useMarkConversationSeen,
  useUserOnlineStatus,
} from '../../../hooks/use-chat';
import { useChatSocket } from '../../../hooks/use-chat-socket';
import type { Conversation, ChatMessage } from '../../../lib/api/chat';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import ChatInput from '../../../components/chats/chat-input';

const DEFAULT_AVATAR =
  'https://ik.imagekit.io/andrieltecshop/products/avatar.jpg?updatedAt=1763005913773';

const InboxPage = () => {
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useAuth();
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

  const conversationIdFromUrl = searchParams.get('conversationId');

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations(1, 50, !!user);

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    selectedConversation?.id || '',
    1,
    50,
    !!selectedConversation
  );

  // Mark conversation as seen mutation
  const markSeenMutation = useMarkConversationSeen();

  // Check if other participant is online
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
        data.userId !== user?.id
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
    [selectedConversation?.id, user?.id]
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
    enabled: !!user,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, isConnected, joinConversation, leaveConversation, markAsSeen]);

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
    router.push(`/inbox?conversationId=${conversation.id}`, { scroll: false });
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
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <MessageCircle size={48} className="text-gray-400" />
        <p className="text-gray-600">Please log in to view your messages</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary-dark transition"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="md:w-[90%] lg:w-[80%] mx-auto pt-5 px-4">
        <div className="flex h-[80vh] shadow-lg rounded-lg overflow-hidden border border-gray-200">
          {/* Conversations List */}
          <div
            className={`${
              selectedConversation ? 'hidden md:block' : 'block'
            } w-full md:w-[320px] border-r border-gray-200 bg-gray-50`}
          >
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MessageCircle size={20} className="text-brand-primary" />
                Messages
              </h2>
              {isConnected ? (
                <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Connected
                </span>
              ) : isConnecting ? (
                <span className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  Connecting...
                </span>
              ) : connectionError ? (
                <button
                  onClick={reconnect}
                  className="text-xs text-red-600 flex items-center gap-1 mt-1 hover:underline"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  {connectionError} - Click to retry
                </button>
              ) : null}
            </div>

            <div className="divide-y divide-gray-200 overflow-y-auto max-h-[calc(80vh-60px)]">
              {conversationsLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto" />
                </div>
              ) : conversationsError ? (
                <div className="p-4 text-sm text-red-500 text-center">
                  Failed to load conversations
                </div>
              ) : !conversationsData?.conversations?.length ? (
                <div className="p-8 text-center">
                  <MessageCircle
                    size={40}
                    className="text-gray-300 mx-auto mb-3"
                  />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start chatting with a seller from a product page
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
                      className={`w-full text-left px-4 py-3 transition hover:bg-blue-50 ${
                        isActive ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={
                              conversation.otherParticipant.avatar ||
                              DEFAULT_AVATAR
                            }
                            alt={conversation.otherParticipant.name}
                            width={44}
                            height={44}
                            className="rounded-full border w-[44px] h-[44px] object-cover"
                          />
                          {hasUnread && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unreadCount > 9
                                ? '9+'
                                : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm truncate ${
                                hasUnread
                                  ? 'font-bold text-gray-900'
                                  : 'font-medium text-gray-800'
                              }`}
                            >
                              {conversation.otherParticipant.name}
                            </span>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm truncate ${
                              hasUnread ? 'text-gray-700' : 'text-gray-500'
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
            } flex-1 flex-col bg-white`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
                  <button
                    onClick={() => {
                      setSelectedConversation(null);
                      router.push('/inbox', { scroll: false });
                    }}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="relative">
                    <Image
                      src={
                        selectedConversation.otherParticipant.avatar ||
                        DEFAULT_AVATAR
                      }
                      alt={selectedConversation.otherParticipant.name}
                      width={40}
                      height={40}
                      className="rounded-full border w-[40px] h-[40px] object-cover"
                    />
                    {isOtherParticipantOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedConversation.otherParticipant.name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {isOtherParticipantOnline ? (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-green-600">Online</span>
                        </>
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messageContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                >
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary" />
                    </div>
                  ) : localMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageCircle size={40} className="mb-2" />
                      <p>No messages yet</p>
                      <p className="text-sm">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    localMessages.map((message) => {
                      // For user-ui, user's messages (senderType === 'user') should be on the right
                      const isOwnMessage = message.senderType === 'user';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-brand-primary text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-white/70' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {isTyping &&
                    isTyping.conversationId === selectedConversation.id && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 rounded-2xl px-4 py-2 rounded-bl-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            />
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
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
                  onSend={(message, attachments) => {
                    if (selectedConversation) {
                      sendWsMessage(selectedConversation.id, message);
                      setNewMessage('');
                      sendTyping(selectedConversation.id, false);
                    }
                  }}
                  onTyping={(typing) => {
                    if (selectedConversation) {
                      sendTyping(selectedConversation.id, typing);
                    }
                  }}
                  disabled={!isConnected}
                  isConnecting={!isConnected}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageCircle size={60} className="mb-4" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">
                  Choose from your existing conversations
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
