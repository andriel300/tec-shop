import Link from 'next/link';
import React from 'react';

interface Props {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  href?: string;
  badge?: number; // Optional badge count
  onClick?: () => void; // Optional click handler for actions
  children?: React.ReactNode;
}

const SidebarItems = ({
  icon,
  title,
  isActive,
  href,
  badge,
  onClick,
  children,
}: Props) => {
  const itemContent = (
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

  if (onClick) {
    return (
      <div className="my-2">
        <button onClick={onClick} className="block w-full text-left">
          {itemContent}
        </button>
        {children && <div className="mt-2 ml-4">{children}</div>}
      </div>
    );
  }

  return (
    <div className="my-2">
      <Link href={href || '#'} className="block">
        {itemContent}
      </Link>
      {children && <div className="mt-2 ml-4">{children}</div>}
    </div>
  );
};

export default SidebarItems;
