import { Link } from '@/i18n/navigation';
import React from 'react';

interface Props {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  href?: string;
  badge?: number; // Optional badge count
  onClick?: () => void; // Optional click handler for actions
}

const SidebarItems = ({ icon, title, isActive, href, badge, onClick }: Props) => {
  const content = (
    <div
      className={`flex gap-2 w-full min-h-12 h-full items-center px-[13px] rounded-lg cursor-pointer transition hover:bg-[#2b2f31] ${
        isActive &&
        'scale-[.98] bg-[#0f3158] fill-blue-200 hover:bg-[#0f3158d6]'
      }`}
    >
      {icon}
      <h5 className="text-slate-200 text-lg flex-1">{title}</h5>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
          {badge}
        </span>
      )}
    </div>
  );

  // If onClick is provided, render as button instead of Link
  if (onClick) {
    return (
      <button onClick={onClick} className="my-2 block w-full text-left">
        {content}
      </button>
    );
  }

  // Otherwise render as Link
  return (
    <Link href={href || '#'} className="my-2 block">
      {content}
    </Link>
  );
};

export default SidebarItems;
