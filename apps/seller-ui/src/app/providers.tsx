'use client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '../contexts/auth-context';
import { ThemeApplier } from '../components/Navbar/ThemeToggle';
import { useUIStore } from '../store/ui.store';

function ToasterWithTheme() {
  const theme = useUIStore((s) => s.theme);
  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={theme}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeApplier />
        {children}
        <ToasterWithTheme />
      </AuthProvider>
    </QueryClientProvider>
  );
}
