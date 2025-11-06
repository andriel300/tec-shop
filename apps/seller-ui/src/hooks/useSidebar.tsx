'use client';

import { useSidebarStore } from '../configs/constants';

const useSidebar = () => {
  const activeSidebar = useSidebarStore((state) => state.activeSidebar);
  const setActiveSidebar = useSidebarStore((state) => state.setActiveSidebar);

  return {
    activeSidebar,
    setActiveSidebar,
  };
};

export default useSidebar;
