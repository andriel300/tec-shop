'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIStore {
  collapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      collapsed: false,
      toggleSidebar: () => set((s) => ({ collapsed: !s.collapsed })),
      setSidebarCollapsed: (collapsed) => set({ collapsed }),
    }),
    {
      name: 'admin-ui-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
