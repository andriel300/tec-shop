'use client';

import React from 'react';
import { Package, Tag, Star } from 'lucide-react';

export type ShopTab = 'products' | 'offers' | 'reviews';

interface ShopTabsProps {
  activeTab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
  productCount?: number;
}

const tabs: { id: ShopTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'products',
    label: 'Products',
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: 'offers',
    label: 'Offers',
    icon: <Tag className="w-4 h-4" />,
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: <Star className="w-4 h-4" />,
  },
];

const ShopTabs: React.FC<ShopTabsProps> = ({
  activeTab,
  onTabChange,
  productCount,
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'products' && productCount !== undefined && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {productCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShopTabs;
