import { create } from 'zustand';

interface SidebarState {
  activeSidebar: string;
  setActiveSidebar: (path: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  activeSidebar: '/dashboard',
  setActiveSidebar: (path) => set({ activeSidebar: path }),
}));
