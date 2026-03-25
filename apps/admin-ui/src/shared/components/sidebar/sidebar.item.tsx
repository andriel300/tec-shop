// eslint-disable-next-line @nx/enforce-module-boundaries
import { Link } from 'apps/admin-ui/src/i18n/navigation';
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
      className={`flex gap-2.5 w-full min-h-9 items-center px-3 rounded-md cursor-pointer transition-colors duration-150 hover:bg-white/5 ${
        isActive &&
        'bg-blue-600/10 border border-blue-500/20 fill-blue-200 hover:bg-blue-600/15'
      }`}
    >
      {icon}
      <h5 className="text-slate-300 text-sm flex-1 font-normal">{title}</h5>

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
