'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import CategoriesTab from './_components/categories/CategoriesTab';
import BrandsTab from './_components/brands/BrandsTab';
import HeroSlidesTab from './_components/hero-slides/HeroSlidesTab';
import LayoutTab from './_components/layout/LayoutTab';

type TabType = 'categories' | 'brands' | 'heroSlides' | 'layout';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'categories',
    label: 'Categories',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: 'brands',
    label: 'Brands',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: 'heroSlides',
    label: 'Hero Slides',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'layout',
    label: 'Layout',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
];

const CustomizationPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('categories');

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-3xl font-semibold">Customization</h1>
        <p className="text-slate-400 mt-1">
          Manage categories, brands, and site layout across the platform
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit border border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'brands' && <BrandsTab />}
      {activeTab === 'heroSlides' && <HeroSlidesTab />}
      {activeTab === 'layout' && <LayoutTab />}
    </div>
  );
};

export default CustomizationPage;
