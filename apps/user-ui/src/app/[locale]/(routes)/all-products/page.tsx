'use client';

export const dynamic = 'force-dynamic';

import { createLogger } from '@tec-shop/next-logger';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/client';
import { Link } from '../../../../i18n/navigation';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useMessages } from 'next-intl';
import nextDynamic from 'next/dynamic';
import { ChevronDown, X } from 'lucide-react';
import ProductCard from '../../../../components/cards/product-card';
import type { Product } from '../../../../lib/api/products';

const logger = createLogger('user-ui:products');
const PriceRangeSlider = nextDynamic(() => import('./price-range-slider'), { ssr: false });

const ProductsPage = () => {
  const t = useTranslations('AllProducts');
  const tCat = useTranslations('Categories');
  const messages = useMessages();
  const catMessages = (messages.Categories ?? {}) as Record<string, string>;
  const searchParams = useSearchParams();

  const translateCategory = (slug: string, name: string): string => {
    return catMessages[slug]
      ? tCat(slug as Parameters<typeof tCat>[0])
      : name;
  };
  const categoryIdParam = searchParams.get('categoryId');
  const isMounted = useRef(false);
  const [isProductLoading, setIsProductLoading] = React.useState(false);
  const [priceRange, setPriceRange] = React.useState([0, 1199]);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<
    string[]
  >(() => {
    const catId = searchParams.get('categoryId');
    return catId ? catId.split(',').filter(Boolean) : [];
  });
  const [selectedSizes, setSelectedSizes] = React.useState<string[]>([]);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [tempPriceRange, setTempPriceRange] = React.useState([0, 1199]);
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(true);
  const [isColorsOpen, setIsColorsOpen] = React.useState(true);
  const [isSizesOpen, setIsSizesOpen] = React.useState(true);
  const [sortBy, setSortBy] = React.useState('newest');

  // Sync selectedCategoryIds when the URL param changes via external navigation
  // (e.g. clicking a category from the dropdown while already on this page).
  // The isMounted guard skips the first run so we don't double-fetch on mount.
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const newIds = categoryIdParam ? categoryIdParam.split(',').filter(Boolean) : [];
    // Use functional update: return the same reference if content is unchanged
    // so React skips re-render and avoids a double-fetch
    setSelectedCategoryIds((prev) => {
      const isSame =
        prev.length === newIds.length && newIds.every((id) => prev.includes(id));
      return isSame ? prev : newIds;
    });
    setPriceRange([0, 1199]);
    setTempPriceRange([0, 1199]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPage(1);
  }, [categoryIdParam]);

  // Helper function to get color hex code from color name
  const getColorCode = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      black: '#000',
      white: '#fff',
      red: '#f00',
      green: '#0f0',
      blue: '#00f',
      yellow: '#ff0',
      orange: '#ffa500',
      purple: '#800080',
      pink: '#ffc0cb',
      brown: '#a52a2a',
      gray: '#808080',
      grey: '#808080',
      cyan: '#00ffff',
      magenta: '#ff00ff',
      silver: '#c0c0c0',
      gold: '#ffd700',
      beige: '#f5f5dc',
      navy: '#000080',
      teal: '#008080',
      maroon: '#800000',
      olive: '#808000',
      lime: '#00ff00',
      aqua: '#00ffff',
      fuchsia: '#ff00ff',
      indigo: '#4b0082',
      violet: '#ee82ee',
      crimson: '#dc143c',
      khaki: '#f0e68c',
      lavender: '#e6e6fa',
      mint: '#98ff98',
      peach: '#ffdab9',
      salmon: '#fa8072',
      tan: '#d2b48c',
      turquoise: '#40e0d0',
    };

    const lowerColorName = colorName.toLowerCase();
    return colorMap[lowerColorName] || '#cccccc';
  };

  const updateURL = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('priceRange', priceRange.join(','));
    if (selectedCategoryIds.length > 0) {
      params.set('categoryId', selectedCategoryIds.join(','));
    } else {
      params.delete('categoryId');
    }
    params.set('page', page.toString());
    params.set('colors', selectedColors.join(','));
    params.set('sizes', selectedSizes.join(','));
    window.history.pushState(null, '', `?${params.toString()}`);
  }, [priceRange, selectedCategoryIds, selectedColors, selectedSizes, page]);

  const fetchFilteredProducts = useCallback(async () => {
    setIsProductLoading(true);
    try {
      const query = new URLSearchParams();

      // Price range filters
      query.set('minPrice', priceRange[0].toString());
      query.set('maxPrice', priceRange[1].toString());

      // Category filter — backend expects categoryId
      if (selectedCategoryIds.length > 0) {
        query.set('categoryId', selectedCategoryIds.join(','));
      }

      // Color filter - backend now supports variant filtering
      if (selectedColors.length > 0) {
        query.set('colors', selectedColors.join(','));
      }

      // Size filter - backend now supports variant filtering
      if (selectedSizes.length > 0) {
        query.set('sizes', selectedSizes.join(','));
      }

      // Pagination
      const limit = 12;
      const offset = (page - 1) * limit;
      query.set('limit', limit.toString());
      query.set('offset', offset.toString());

      // Sorting
      query.set('sort', sortBy);

      const res = await apiClient.get(`/public/products?${query.toString()}`);

      setProducts(res.data.products || []);

      // Calculate total pages from total count
      const totalCount = res.data.total || 0;
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / limit));
    } catch (error) {
      logger.error('Error fetching filtered products:', { error });
      setProducts([]);
      setTotalPages(1);
    } finally {
      setIsProductLoading(false);
    }
  }, [priceRange, selectedCategoryIds, selectedColors, selectedSizes, page, sortBy]);

  useEffect(() => {
    updateURL();
    fetchFilteredProducts();
  }, [
    priceRange,
    selectedCategoryIds,
    selectedColors,
    selectedSizes,
    page,
    sortBy,
    updateURL,
    fetchFilteredProducts
  ]);

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get(`/categories`);
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: filterOptions, isLoading: isFiltersLoading } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      const res = await apiClient.get(`/public/products/filters/options`);
      return res.data as { colors: string[]; sizes: string[] };
    },
    staleTime: 1000 * 60 * 30,
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    setPage(1);
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    setPage(1);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategoryIds([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 1199]);
    setTempPriceRange([0, 1199]);
    setPage(1);
  };

  const hasActiveFilters =
    selectedCategoryIds.length > 0 ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 1199;

  const getCategoryName = (id: string): string => {
    const cat = (
      categories as { id: string; name: string; slug: string }[] | undefined
    )?.find((c) => c.id === id);
    if (!cat) return id;
    return translateCategory(cat.slug, cat.name);
  };

  const getPageTitle = () => {
    if (selectedCategoryIds.length === 1) {
      return getCategoryName(selectedCategoryIds[0]);
    }
    if (selectedCategoryIds.length > 1) {
      return t('multipleCategories');
    }
    return t('title');
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-10">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="pt-6 pb-5">
          <div className="flex items-center gap-1.5 text-sm text-[#55585b] mb-1">
            <Link href="/" className="hover:underline">{t('home')}</Link>
            <span className="inline-block w-1 h-1 bg-[#a8acb0] rounded-full"></span>
            <span>{t('title')}</span>
          </div>
          <h1 className="font-medium text-3xl font-Jost text-gray-900">{t('title')}</h1>
        </div>
        <div className="w-full flex flex-col gap-8 lg:flex-row">
          {/* sidebar */}
          <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-md">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('priceFilter')}</h3>
            <div className="ml-2">
              <PriceRangeSlider
                values={tempPriceRange}
                onChange={(values) => setTempPriceRange(values)}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-600">
                ${tempPriceRange[0]} - ${tempPriceRange[1]}
              </div>
              <button
                onClick={() => {
                  setPriceRange(tempPriceRange);
                  setPage(1);
                }}
                className="text-sm px-4 py-1 bg-gray-200 hover:bg-blue-600 hover:text-white rounded-sm transition duration-200 ease-in-out"
              >
                {t('apply')}
              </button>
            </div>

            {/* Categories */}
            <div>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-b-slate-200 pb-1 hover:text-blue-600 transition-colors"
              >
                <span>{t('categories')}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isCategoriesOpen && (
                <ul className="space-y-2 !mt-3 max-h-[300px] overflow-y-auto">
                  {isCategoriesLoading ? (
                    <p className="text-sm text-gray-500">
                      {t('loadingCategories')}
                    </p>
                  ) : categories &&
                    Array.isArray(categories) &&
                    categories.length > 0 ? (
                    categories.map((category: { id: string; name: string; slug: string }) => (
                      <li
                        key={category.id}
                        className="flex items-center justify-between"
                      >
                        <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer rounded-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          {translateCategory(category.slug, category.name)}
                        </label>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t('noCategoriesAvailable')}
                    </p>
                  )}
                </ul>
              )}
            </div>

            {/* Colors */}
            <div>
              <button
                onClick={() => setIsColorsOpen(!isColorsOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-b-slate-200 pb-1 mt-6 hover:text-blue-600 transition-colors"
              >
                <span>{t('colors')}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${isColorsOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isColorsOpen && (
                <div className="mt-3">
                  {isFiltersLoading ? (
                    <p className="text-sm text-gray-500">{t('loadingColors')}</p>
                  ) : filterOptions?.colors && filterOptions.colors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.colors.map((colorName) => {
                        const isSelected = selectedColors.includes(colorName);
                        return (
                          <button
                            key={colorName}
                            type="button"
                            onClick={() => toggleColor(colorName)}
                            title={colorName}
                            aria-label={`${isSelected ? 'Remove' : 'Add'} ${colorName} filter`}
                            aria-pressed={isSelected}
                            className={`w-7 h-7 rounded-full border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${isSelected
                              ? 'border-blue-600 scale-110 shadow-md'
                              : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                              }`}
                            style={{ backgroundColor: getColorCode(colorName) }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">{t('noColorsAvailable')}</p>
                  )}
                </div>
              )}
            </div>

            {/* Sizes */}
            <div>
              <button
                onClick={() => setIsSizesOpen(!isSizesOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-b-slate-200 pb-1 mt-6 hover:text-blue-600 transition-colors"
              >
                <span>{t('sizes')}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${isSizesOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isSizesOpen && (
                <ul className="space-y-2 !mt-3 max-h-[300px] overflow-y-auto">
                  {isFiltersLoading ? (
                    <p className="text-sm text-gray-500">{t('loadingSizes')}</p>
                  ) : filterOptions?.sizes && filterOptions.sizes.length > 0 ? (
                    filterOptions.sizes.map((size) => (
                      <li
                        key={size}
                        className="flex items-center justify-between"
                      >
                        <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedSizes.includes(size)}
                            onChange={() => toggleSize(size)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer rounded-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="font-medium">{size}</span>
                        </label>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{t('noSizesAvailable')}</p>
                  )}
                </ul>
              )}
            </div>
          </aside>

          {/* product grid */}
          <div className="flex-1 px-2 lg:px-3">
            {/* Header with title, count, and sort */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {getPageTitle()}
                  <span className="text-gray-500 font-normal ml-2">
                    ({total} {total === 1 ? t('product') : t('products')})
                  </span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('showing', {
                    start: products.length > 0 ? (page - 1) * 12 + 1 : 0,
                    end: Math.min(page * 12, total),
                    total,
                  })}
                </p>
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort"
                  className="text-sm text-gray-700 whitespace-nowrap"
                >
                  {t('sortBy')}
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
                >
                  <option value="newest">{t('newest')}</option>
                  <option value="price-asc">{t('priceLowHigh')}</option>
                  <option value="price-desc">{t('priceHighLow')}</option>
                  <option value="popular">{t('mostPopular')}</option>
                  <option value="top-sales">{t('bestSelling')}</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    {t('activeFilters')}
                  </h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t('clearAll')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Category filters */}
                  {selectedCategoryIds.map((catId) => (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span className="font-medium">{t('categoryLabel')}</span>{' '}
                      {getCategoryName(catId)}
                      <button
                        onClick={() => toggleCategory(catId)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}

                  {/* Color filters */}
                  {selectedColors.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-purple-300"
                        style={{ backgroundColor: getColorCode(color) }}
                      ></span>
                      {color}
                      <button
                        onClick={() => toggleColor(color)}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}

                  {/* Size filters */}
                  {selectedSizes.map((size) => (
                    <span
                      key={size}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      <span className="font-medium">{t('sizeLabel')}</span> {size}
                      <button
                        onClick={() => toggleSize(size)}
                        className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}

                  {/* Price range filter */}
                  {(priceRange[0] !== 0 || priceRange[1] !== 1199) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm">
                      <span className="font-medium">{t('priceLabel')}</span> $
                      {priceRange[0]} - ${priceRange[1]}
                      <button
                        onClick={() => {
                          setPriceRange([0, 1199]);
                          setTempPriceRange([0, 1199]);
                        }}
                        className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Product Grid */}
            {isProductLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[350px] bg-gray-200 animate-pulse rounded-xl"
                  ></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="mx-auto w-24 h-24 mb-4 text-gray-300">
                  <svg
                    className="w-full h-full"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('noProductsFound')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('noProductsDesc')}
                  <br />
                  {t('tryAdjusting')}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('clearAllFilters')}
                  </button>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-1.5 items-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded border border-gray-200 text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('prev')}
                </button>

                {(() => {
                  const pages: (number | 'ellipsis')[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 3) pages.push('ellipsis');
                    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                      pages.push(i);
                    }
                    if (page < totalPages - 2) pages.push('ellipsis');
                    pages.push(totalPages);
                  }
                  return pages.map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm select-none">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded border text-sm transition-colors ${page === p
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded border border-gray-200 text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div className="w-full bg-[#f5f5f5] pb-10 min-h-screen" />}>
      <ProductsPage />
    </Suspense>
  );
}
