'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../../contexts/auth-context';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';
import { Sidebar } from '../../../../components/Sidebar';
import { Navbar } from '../../../../components/Navbar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#080E1A]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#080E1A]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#080E1A]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
