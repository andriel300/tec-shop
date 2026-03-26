import { useSidebarStore } from '../configs/constants';

const useSidebar = () => {
  const activeSidebar = useSidebarStore((s) => s.activeSidebar);
  const setActiveSidebar = useSidebarStore((s) => s.setActiveSidebar);
  return { activeSidebar, setActiveSidebar };
};

export default useSidebar;
