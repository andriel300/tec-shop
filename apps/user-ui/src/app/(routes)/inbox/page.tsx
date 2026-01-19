'use client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from 'apps/user-ui/src/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useRef, useState } from 'react';

const Page = () => {
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useAuth();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const [chats, setChats] = React.useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = React.useState<any | null>(null);
  const [message, setMessage] = React.useState('');
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = useState(1);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const conversationId = searchParams.get('conversationId');

  return (
    <div className="w-full">
      <div className="md:w-[80%] mx-auto pt-5">
        <div className="flex h-[80vh] shadow-sm overflow-hidden">
          <div className="w-[320px] border-r border-r-gray-200 bg-gray-50">
            <div className="p-4 border-p border-b-gray-200 text-lg font-semibold text-gray-800">
              Messages
            </div>
            <div className="divide-y divide-gray-200">
              {/* {isLoading ? ( */}
              {/*   <div>Loading...</div>)} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
