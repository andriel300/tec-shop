import React from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
}

const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className="block">
      <h3 className="text-[10px] font-semibold tracking-[0.1rem] pl-1 text-slate-600 uppercase mt-4 mb-0.5">{title}</h3>

      {children}
    </div>
  );
};

export default SidebarMenu;
