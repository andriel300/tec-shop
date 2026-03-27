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
          position="bottom-right"
          richColors
          gap={8}
          toastOptions={{
            duration: 4000,
            classNames: {
              toast:
                '!rounded-xl !shadow-[0_8px_24px_rgba(15,23,36,0.14)] !border-0 !font-sans',
              title:
                '!text-sm !font-semibold !font-heading',
              description:
                '!text-xs !leading-relaxed !opacity-90',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
