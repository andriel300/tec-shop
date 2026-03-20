'use client';

import React from 'react';
import { PanelLeft } from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import LanguageSwitcher from '../language-switcher';
import { NotificationBellV2 } from '../notification-bell-v2';

const Navbar = () => {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-40 flex items-center h-16 px-4 gap-3 bg-white/95 dark:bg-[#080E1A]/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        title="Toggle sidebar"
      >
        <PanelLeft size={19} />
      </button>

      {/* Search */}
      <SearchBar />

      {/* Right section */}
      <div className="flex items-center gap-1 ml-auto">
        <ThemeToggle />
        <LanguageSwitcher />
        <NotificationBellV2 />
        <div className="w-px h-5 bg-gray-300 dark:bg-slate-700/70 mx-2" />
        <UserMenu />
      </div>
    </header>
  );
};

export default Navbar;
