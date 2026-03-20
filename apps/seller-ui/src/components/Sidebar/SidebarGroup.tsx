'use client';

import React from 'react';
import { useUIStore } from '../../store/ui.store';

interface SidebarGroupProps {
  title: string;
  children: React.ReactNode;
}

const SidebarGroup = ({ title, children }: SidebarGroupProps) => {
  const collapsed = useUIStore((s) => s.collapsed);

  return (
    <div className="mt-4">
      {collapsed ? (
        <div className="mx-2 mb-2 border-t border-gray-200 dark:border-slate-700/50" />
      ) : (
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          {title}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};

export default SidebarGroup;
