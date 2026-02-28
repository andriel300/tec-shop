'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import SidebarBarWrapper from '../../../../components/sidebar/sidebar';
import { useAuth } from '../../../../contexts/auth-context';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-black min-h-screen">
      {/* sidebar */}
      <aside className="w-[280px] min-w-[250px] max-w-[300px] border-r border-r-slate-800 text-white">
        <div className="sticky top-0">
          <SidebarBarWrapper />
        </div>
      </aside>

      {/* main content */}
      <main className="flex-1 ">
        <div className="overflow-auto">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
