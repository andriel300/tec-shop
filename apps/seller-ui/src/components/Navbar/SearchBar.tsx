'use client';

import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = () => {
  return (
    <div className="relative hidden sm:flex items-center">
      <Search
        size={15}
        className="absolute left-3 text-gray-400 dark:text-slate-500 pointer-events-none"
      />
      <input
        type="text"
        placeholder="Search..."
        className="
          w-44 lg:w-60 pl-9 pr-3 h-9
          bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700/60 rounded-lg
          text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500
          focus:outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/30
          transition-colors
        "
      />
    </div>
  );
};

export default SearchBar;
