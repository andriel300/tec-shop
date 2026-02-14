'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/client';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Range } from 'react-range';
import { ChevronDown, X } from 'lucide-react';
import ProductCard from '../../../components/cards/product-card';

const MIN = 0;
const MAX = 1199;

const Page = () => {
  const searchParams = useSearchParams();
  const [isProductLoading, setIsProductLoading] = React.useState(false);
  const [priceRange, setPriceRange] = React.useState([0, 1199]);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<
    string[]
  >(() => {
    const catId = searchParams.get('categoryId');
    return catId ? [catId] : [];
  });
  const [selectedSizes, setSelectedSizes] = React.useState<string[]>([]);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [products, setProducts] = React.useState<any[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [tempPriceRange, setTempPriceRange] = React.useState([0, 1199]);
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(true);
  const [isColorsOpen, setIsColorsOpen] = React.useState(true);
  const [isSizesOpen, setIsSizesOpen] = React.useState(true);
  const [sortBy, setSortBy] = React.useState('newest');

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

  const updateURL = () => {
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
  };

  const fetchFilteredProducts = async () => {
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
      console.error('Error fetching filtered products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setIsProductLoading(false);
    }
  };

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
    const cat = (categories as { id: string; name: string }[] | undefined)?.find(
      (c) => c.id === id
    );
    return cat?.name || id;
  };

  const getPageTitle = () => {
    if (selectedCategoryIds.length === 1) {
      return getCategoryName(selectedCategoryIds[0]);
    }
    if (selectedCategoryIds.length > 1) {
      return 'Multiple Categories';
    }
    return 'All Products';
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-10">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="pb-[50px]">
          <h1 className="md:pt-[40px] font-medium text-[44px] leading-1 mb-[14px] font-Jost">
            All Products
          </h1>
          <Link href="/" className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">All Products</span>
        </div>
        <div className="w-full flex flex-col gap-8 lg:flex-row">
          {/* sidebar */}
          <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-md">
            <h3 className="text-xl font-heading font-medium">Price Filter</h3>
            <div className="ml-2">
              <Range
                step={1}
                min={MIN}
                max={MAX}
                values={tempPriceRange}
                onChange={(values) => setTempPriceRange(values)}
                renderTrack={({ props, children }) => {
                  const [min, max] = tempPriceRange;
                  const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                  const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;

                  return (
                    <div
                      {...props}
                      className="h-[6px] bg-blue-200 rounded relative"
                      style={{ ...props.style }}
                    >
                      <div
                        className="absolute h-full bg-blue-600 rounded"
                        style={{
                          left: `${percentageLeft}%`,
                          width: `${percentageRight - percentageLeft}%`,
                        }}
                      />
                      {children}
                    </div>
                  );
                }}
                renderThumb={({ props }) => {
                  const { key, ...rest } = props;
                  return (
                    <div
                      key={key}
                      {...rest}
                      className="w-[16px] h-[16px] bg-blue-600 rounded-full shadow"
                    />
                  );
                }}
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
                Apply
              </button>
            </div>

            {/* Categories */}
            <div>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="w-full flex items-center justify-between text-xl font-heading font-medium border-b border-b-slate-300 pb-1 hover:text-blue-600 transition-colors"
              >
                <span>Categories</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isCategoriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isCategoriesOpen && (
                <ul className="space-y-2 !mt-3 max-h-[300px] overflow-y-auto">
                  {isCategoriesLoading ? (
                    <p className="text-sm text-gray-500">
                      Loading categories...
                    </p>
                  ) : categories &&
                    Array.isArray(categories) &&
                    categories.length > 0 ? (
                    categories.map((category: { id: string; name: string }) => (
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
                          {category.name}
                        </label>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No categories available
                    </p>
                  )}
                </ul>
              )}
            </div>

            {/* Colors */}
            <div>
              <button
                onClick={() => setIsColorsOpen(!isColorsOpen)}
                className="w-full flex items-center justify-between text-xl font-heading font-medium border-b border-b-slate-300 pb-1 mt-6 hover:text-blue-600 transition-colors"
              >
                <span>Filter by Color</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isColorsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isColorsOpen && (
                <ul className="space-y-2 !mt-3 max-h-[300px] overflow-y-auto">
                  {isFiltersLoading ? (
                    <p className="text-sm text-gray-500">Loading colors...</p>
                  ) : filterOptions?.colors &&
                    filterOptions.colors.length > 0 ? (
                    filterOptions.colors.map((colorName) => (
                      <li
                        key={colorName}
                        className="flex items-center justify-between"
                      >
                        <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedColors.includes(colorName)}
                            onChange={() => toggleColor(colorName)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer rounded-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span
                            className="w-[16px] h-[16px] rounded-full border border-gray-200"
                            style={{ backgroundColor: getColorCode(colorName) }}
                          ></span>
                          {colorName}
                        </label>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No colors available</p>
                  )}
                </ul>
              )}
            </div>

            {/* Sizes */}
            <div>
              <button
                onClick={() => setIsSizesOpen(!isSizesOpen)}
                className="w-full flex items-center justify-between text-xl font-heading font-medium border-b border-b-slate-300 pb-1 mt-6 hover:text-blue-600 transition-colors"
              >
                <span>Filter by Size</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isSizesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSizesOpen && (
                <ul className="space-y-2 !mt-3 max-h-[300px] overflow-y-auto">
                  {isFiltersLoading ? (
                    <p className="text-sm text-gray-500">Loading sizes...</p>
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
                    <p className="text-sm text-gray-500">No sizes available</p>
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
                    ({total} {total === 1 ? 'product' : 'products'})
                  </span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {products.length > 0 ? (page - 1) * 12 + 1 : 0}-
                  {Math.min(page * 12, total)} of {total} results
                </p>
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort"
                  className="text-sm text-gray-700 whitespace-nowrap"
                >
                  Sort by:
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
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                  <option value="top-sales">Best Selling</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Active Filters
                  </h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Category filters */}
                  {selectedCategoryIds.map((catId) => (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span className="font-medium">Category:</span>{' '}
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
                      <span className="font-medium">Size:</span> {size}
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
                      <span className="font-medium">Price:</span> $
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
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  We could not find any products matching your filters.
                  <br />
                  Try adjusting your search criteria.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 !rounded border border-gray-200 text-sm ${
                      page === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-black'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
