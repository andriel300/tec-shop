'use client';

import React from 'react';
import useSeller from '../../hooks/useSeller';

const UserMenu = () => {
  const { seller, isLoading } = useSeller();

  const displayName =
    seller?.shop?.businessName || seller?.name || 'Seller';
  const initials = displayName.slice(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
        <div className="hidden lg:block w-20 h-3 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-brand-primary-300 leading-none">
          {initials}
        </span>
      </div>
      <div className="hidden lg:block min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate max-w-[120px] leading-tight">
          {displayName}
        </p>
      </div>
    </div>
  );
};

export default UserMenu;
