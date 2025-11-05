import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <div className={`flex items-center mb-6 ${className}`}>
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
  );
};

Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
