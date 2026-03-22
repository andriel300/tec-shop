'use client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '../contexts/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 2 * 60 * 1000,
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                '!rounded-[10px] !border !border-[#E5E7EB] !shadow-[0_4px_8px_rgba(15,23,36,0.08)]',
              title: '!text-sm !font-medium !text-[#0F1724]',
              description: '!text-xs !text-[#6B7280]',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
