'use client';

import React from 'react';
import { Link } from '../../i18n/navigation';
import { useUIStore } from '../../store/ui.store';

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  href?: string;
  badge?: number;
  onClick?: () => void;
}

const SidebarItem = ({
  icon,
  title,
  isActive,
  href,
  badge,
  onClick,
}: SidebarItemProps) => {
  const collapsed = useUIStore((s) => s.collapsed);

  const content = (
    <div
      title={collapsed ? title : undefined}
      className={`
        flex items-center w-full min-h-10 rounded-lg cursor-pointer
        transition-all duration-200 select-none
        ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}
        ${
          isActive
            ? 'bg-brand-primary/10 text-brand-primary-400'
            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/70 hover:text-gray-900 dark:hover:text-slate-200'
        }
      `}
    >
      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
        {icon}
      </span>

      {!collapsed && (
        <span className="text-sm font-medium flex-1 truncate leading-none">
          {title}
        </span>
      )}

      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="my-0.5 block w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={href || '#'} className="my-0.5 block">
      {content}
    </Link>
  );
};

export default SidebarItem;
