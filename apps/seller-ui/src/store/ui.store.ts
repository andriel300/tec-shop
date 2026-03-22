'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIStore {
  collapsed: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      collapsed: false,
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ collapsed: !s.collapsed })),
      setSidebarCollapsed: (collapsed) => set({ collapsed }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'seller-ui-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
