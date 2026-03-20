'use client';

import React, { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../store/ui.store';

/**
 * Applies the current theme to <html> so both:
 *   - Tailwind `dark:` class variants (darkMode: 'class')
 *   - CSS variable overrides ([data-theme="dark"] in tailwind.config.js plugin)
 * are activated simultaneously.
 */
export const ThemeApplier = () => {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  return null;
};

const ThemeToggle = () => {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
};

export default ThemeToggle;
