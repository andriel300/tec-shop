'use client';

import { apiClient } from '../../../../lib/api/client';
import { Link } from '../../../../i18n/navigation';
import React, { useEffect } from 'react';
import { ChevronDown, X, Store, Search, Star } from 'lucide-react';
import ShopCard from '../../../../components/cards/shop-card';
import { countries } from '../../../../lib/utils/countries';

// Shop categories (different from product categories)
const SHOP_CATEGORIES = [
  'Electronics',
  'Fashion & Apparel',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Books & Media',
  'Toys & Games',
  'Food & Beverage',
  'Health & Wellness',
  'Automotive',
  'Office Supplies',
  'Pet Supplies',
  'Jewelry & Accessories',
  'Arts & Crafts',
  'Musical Instruments',
];

const Page = () => {
  const [isShopLoading, setIsShopLoading] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedCountry, setSelectedCountry] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [minRating, setMinRating] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [shops, setShops] = React.useState<any[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(true);
  const [isCountriesOpen, setIsCountriesOpen] = React.useState(false);

  const updateURL = () => {
    const params = new URLSearchParams(window.location.search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCountry) params.set('country', selectedCountry);
    if (searchQuery) params.set('search', searchQuery);
    if (minRating > 0) params.set('minRating', minRating.toString());
    params.set('page', page.toString());
    window.history.pushState(null, '', `?${params.toString()}`);
  };

  const fetchFilteredShops = async () => {
    setIsShopLoading(true);
    try {
      const query = new URLSearchParams();

      // Search query
      if (searchQuery) {
        query.set('search', searchQuery);
      }

      // Category filter
      if (selectedCategory) {
        query.set('category', selectedCategory);
      }

      // Country filter
      if (selectedCountry) {
        query.set('country', selectedCountry);
      }

      // Rating filter
      if (minRating > 0) {
        query.set('minRating', minRating.toString());
      }

      // Pagination
      const limit = 12;
      const offset = (page - 1) * limit;
      query.set('limit', limit.toString());
      query.set('offset', offset.toString());

      const res = await apiClient.get(`/public/shops?${query.toString()}`);

      setShops(res.data.shops || []);

      // Calculate total pages from total count
      const totalCount = res.data.total || 0;
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / limit));
    } catch (error) {
      console.error('Error fetching filtered shops:', error);
      setShops([]);
      setTotalPages(1);
    } finally {
      setIsShopLoading(false);
    }
  };

  useEffect(() => {
    updateURL();
    fetchFilteredShops();
  }, [selectedCategory, selectedCountry, searchQuery, minRating, page]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedCountry('');
    setSearchQuery('');
    setMinRating(0);
    setPage(1);
  };

  const hasActiveFilters =
    selectedCategory !== '' ||
    selectedCountry !== '' ||
    searchQuery !== '' ||
    minRating > 0;

  const getPageTitle = () => {
    if (selectedCategory) {
      return `${selectedCategory} Shops`;
    }
    return 'All Shops';
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-10">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="pb-[50px]">
          <div className="flex items-center gap-3 md:pt-[40px] mb-[14px]">
            <Store className="w-10 h-10 text-blue-600" />
            <h1 className="font-medium text-[44px] leading-1 font-Jost">
              Discover Shops
            </h1>
          </div>
          <p className="text-gray-600 mb-4 text-lg">
            Browse trusted sellers and find the perfect shop for you
          </p>
          <Link href="/" className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Shops</span>
        </div>
        <div className="w-full flex flex-col gap-8 lg:flex-row">
          {/* sidebar */}
          <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-md">
            {/* Search */}
            <div>
              <h3 className="text-xl font-heading font-medium mb-3">
                Search Shops
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="w-full flex items-center justify-between text-xl font-heading font-medium border-b border-b-slate-300 pb-1 hover:text-blue-600 transition-colors"
              >
                <span>Shop Category</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isCategoriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isCategoriesOpen && (
                <ul className="space-y-2 !mt-3 max-h-[300px] overflow-y-auto">
                  <li>
                    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === ''}
                        onChange={() => {
                          setSelectedCategory('');
                          setPage(1);
                        }}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                      All Categories
                    </label>
                  </li>
                  {SHOP_CATEGORIES.map((category) => (
                    <li key={category}>
                      <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category}
                          onChange={() => {
                            setSelectedCategory(category);
                            setPage(1);
                          }}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        {category}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Countries */}
            <div>
              <button
                onClick={() => setIsCountriesOpen(!isCountriesOpen)}
                className="w-full flex items-center justify-between text-xl font-heading font-medium border-b border-b-slate-300 pb-1 hover:text-blue-600 transition-colors"
              >
                <span>Country</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isCountriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isCountriesOpen && (
                <ul className="space-y-2 !mt-3 max-h-[300px] overflow-y-auto">
                  <li>
                    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                      <input
                        type="radio"
                        name="country"
                        checked={selectedCountry === ''}
                        onChange={() => {
                          setSelectedCountry('');
                          setPage(1);
                        }}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                      All Countries
                    </label>
                  </li>
                  {countries.map((country) => (
                    <li key={country.code}>
                      <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                        <input
                          type="radio"
                          name="country"
                          checked={selectedCountry === country.name}
                          onChange={() => {
                            setSelectedCountry(country.name);
                            setPage(1);
                          }}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        {country.name}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="text-xl font-heading font-medium border-b border-b-slate-300 pb-1">
                Minimum Rating
              </h3>
              <ul className="space-y-2 !mt-3">
                {[0, 3, 4, 4.5].map((rating) => (
                  <li key={rating}>
                    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === rating}
                        onChange={() => {
                          setMinRating(rating);
                          setPage(1);
                        }}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                      {rating === 0 ? (
                        'Any Rating'
                      ) : (
                        <div className="flex items-center gap-1">
                          {rating}
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          & up
                        </div>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* shop grid */}
          <div className="flex-1 px-2 lg:px-3">
            {/* Header with title, count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {getPageTitle()}
                  <span className="text-gray-500 font-normal ml-2">
                    ({total} {total === 1 ? 'shop' : 'shops'})
                  </span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {shops.length > 0 ? (page - 1) * 12 + 1 : 0}-
                  {Math.min(page * 12, total)} of {total} results
                </p>
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
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <span className="font-medium">Category:</span>{' '}
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory('')}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {selectedCountry && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm">
                      <span className="font-medium">Country:</span>{' '}
                      {selectedCountry}
                      <button
                        onClick={() => setSelectedCountry('')}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
                      <span className="font-medium">Search:</span> {searchQuery}
                      <button
                        onClick={() => setSearchQuery('')}
                        className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      <span className="font-medium">Rating:</span> {minRating}+
                      ⭐
                      <button
                        onClick={() => setMinRating(0)}
                        className="hover:bg-yellow-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Shop Grid */}
            {isShopLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[250px] bg-gray-200 animate-pulse rounded-xl"
                  ></div>
                ))}
              </div>
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="mx-auto w-24 h-24 mb-4 text-gray-300">
                  <Store className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No shops found
                </h3>
                <p className="text-gray-600 mb-6">
                  We could not find any shops matching your filters.
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
