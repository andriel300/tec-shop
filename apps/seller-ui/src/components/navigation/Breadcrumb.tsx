import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  title?: string;
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  title,
  items,
  className = '',
}) => {
  return (
    <div className={`flex items-center mb-6 gap-3 ${className}`}>
      {/* Title */}
      {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}

      {/* Divider (only if title exists) */}
      {title && <span className="text-gray-500">/</span>}

      {/* Breadcrumb items */}
      <div className="flex items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[#80Deea] hover:text-[#4DD0E1] cursor-pointer transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gray-400' : 'text-[#80Deea]'}>
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight size={20} className="opacity-[.8] mx-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
