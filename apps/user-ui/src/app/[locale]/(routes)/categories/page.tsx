'use client';

import { useTranslations, useMessages } from 'next-intl';
import { Link } from '../../../../i18n/navigation';
import { useCategoryTree } from '../../../../hooks/use-categories';
import type { Category } from '../../../../lib/api/categories';
import { ChevronRight } from 'lucide-react';

const CategoryCard = ({
  category,
  tCat,
  tPage,
  catMessages,
}: {
  category: Category;
  tCat: ReturnType<typeof useTranslations>;
  tPage: ReturnType<typeof useTranslations>;
  catMessages: Record<string, string>;
}) => {
  const translateCategory = (slug: string, name: string): string =>
    catMessages[slug] ? tCat(slug as Parameters<typeof tCat>[0]) : name;

  const name = translateCategory(category.slug, category.name);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
      {/* Card header */}
      <Link
        href={`/all-products?categoryId=${category.id}`}
        className="group relative block bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 p-6 hover:from-brand-primary/20 hover:to-brand-primary/10 transition-colors"
      >
        {category.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image}
            alt={name}
            className="w-12 h-12 object-contain mb-3"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center mb-3">
            <span className="text-brand-primary font-bold text-xl">
              {name.charAt(0)}
            </span>
          </div>
        )}
        <h2 className="font-semibold text-gray-900 text-base group-hover:text-brand-primary transition-colors">
          {name}
        </h2>
        {category.children && category.children.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {category.children.length}{' '}
            {category.children.length === 1 ? 'subcategory' : 'subcategories'}
          </p>
        )}
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
      </Link>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="p-4 flex-1">
          <ul className="space-y-1">
            {category.children.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/all-products?categoryId=${sub.id}`}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-primary transition-colors py-0.5"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                  {translateCategory(sub.slug, sub.name)}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/all-products?categoryId=${category.id}`}
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-brand-primary hover:underline"
          >
            {tPage('shopNow')}
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

const CategoriesSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 bg-gray-100 animate-pulse h-[110px]" />
        <div className="p-4 space-y-2">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function CategoriesPage() {
  const t = useTranslations('CategoriesPage');
  const tCat = useTranslations('Categories');
  const messages = useMessages();
  const catMessages = (messages.Categories ?? {}) as Record<string, string>;
  const { data: categories, isLoading, isError } = useCategoryTree({ onlyActive: true });

  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen pb-16">
      <div className="w-[90%] lg:w-[80%] mx-auto">
        {/* Breadcrumb + heading */}
        <div className="pt-6 pb-8">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:underline hover:text-brand-primary transition-colors">
              {t('home')}
            </Link>
            <span className="inline-block w-1 h-1 bg-gray-400 rounded-full" />
            <span className="text-gray-700">{t('title')}</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 font-Jost">{t('title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t('subtitle')}</p>
        </div>

        {/* Content */}
        {isLoading ? (
          <CategoriesSkeleton />
        ) : isError ? (
          <div className="text-center py-16 text-gray-500">{t('error')}</div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">{t('empty')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                tCat={tCat}
                tPage={t}
                catMessages={catMessages}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
