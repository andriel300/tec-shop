'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import useAdmin from '../../../../hooks/useAdmin';
import { Sidebar } from '../../../../components/Sidebar';
import { Navbar } from '../../../../components/Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdmin();

  if (isLoading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080E1A]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080E1A]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
