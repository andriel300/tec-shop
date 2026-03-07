'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import SidebarWrapper from '../../../../shared/components/sidebar';
import useAdmin from '../../../../hooks/useAdmin';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-black min-h-screen">
      <aside className="w-[280px] min-w-[250px] max-w-[300px] border-r border-r-slate-800 text-white p-4">
        <div className="sticky top-0">
          <SidebarWrapper />
        </div>
      </aside>

      <main className="flex-1">
        <div className="overflow-auto">{children}</div>
      </main>
    </div>
  );
}
