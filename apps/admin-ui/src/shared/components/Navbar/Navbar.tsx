'use client';

import React from 'react';
import { PanelLeft } from 'lucide-react';
import { useUIStore } from '../../../store/ui.store';
import LanguageSwitcher from '../language-switcher';

const Navbar = () => {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-40 flex items-center h-16 px-4 gap-3 bg-[#080E1A]/95 backdrop-blur-sm border-b border-slate-800 flex-shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex-shrink-0"
        title="Toggle sidebar"
      >
        <PanelLeft size={19} />
      </button>

      {/* Right section */}
      <div className="flex items-center gap-1 ml-auto">
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default Navbar;
