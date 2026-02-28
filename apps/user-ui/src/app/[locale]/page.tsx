'use client';

import React from 'react';
import SectionTitle from '../../components/section/section-title';
import ProductCard from '../../components/cards/product-card';
import ShopCard from '../../components/cards/shop-card';
import { useQuery } from '@tanstack/react-query';
import { getPublicProducts } from '../../lib/api/products';
import { getTopShops } from '../../lib/api/shops';
import { useAuth } from '../../contexts/auth-context';
import {
  useRecommendations,
  usePopularProducts,
} from '../../hooks/use-recommendations';
import Hero from '../../shared/modules/hero';

const Page = () => {
  const { user } = useAuth();

  // Fetch personalized recommendations (authenticated) or popular products (public)
  const {
    data: recommendedData,
    isLoading: isRecommendedLoading,
    isError: isRecommendedError,
    error: recommendedError,
  } = useRecommendations(10, !!user);

  const {
    data: popularData,
    isLoading: isPopularLoading,
    isError: isPopularError,
    error: popularError,
  } = usePopularProducts(10, !user);

  // Use personalized if logged in, else popular
  const recProducts = user ? recommendedData : popularData;
  const isRecLoading = user ? isRecommendedLoading : isPopularLoading;
  const isRecError = user ? isRecommendedError : isPopularError;
  const recError = user ? recommendedError : popularError;
  const recTitle = user ? 'Recommended For You' : 'Popular Products';

  // Fetch latest products (offset by 10 to show different products)
  const {
    data: latestData,
    isLoading: isLatestLoading,
    isError: isLatestError,
    error: latestError,
  } = useQuery({
    queryKey: ['products', 'latest', { limit: 10, offset: 10, sort: 'newest' }],
    queryFn: () =>
      getPublicProducts({
        limit: 10,
        offset: 10,
        sort: 'newest',
      }),
  });

  // Fetch top shops (rated 4+ stars)
  const {
    data: topShopsData,
    isLoading: isTopShopsLoading,
    isError: isTopShopsError,
    error: topShopsError,
  } = useQuery({
    queryKey: ['shops', 'top', { limit: 8, minRating: 4 }],
    queryFn: () => getTopShops(8),
  });

  // Fetch top offers (products on sale)
  const {
    data: topOffersData,
    isLoading: isTopOffersLoading,
    isError: isTopOffersError,
    error: topOffersError,
  } = useQuery({
    queryKey: ['products', 'offers', { limit: 10, onSale: true }],
    queryFn: () =>
      getPublicProducts({
        limit: 10,
        onSale: true,
        sort: 'newest',
      }),
  });

  return (
    <div className="bg-[#f5f5f5]">
      <Hero />
      <div className="md:w-[80%] w-[90%] my-10 m-auto">
        {/* Recommended / Popular Products Section */}
        <div className="mb-8">
          <SectionTitle title={recTitle} />
        </div>

        {isRecLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {isRecError && (
          <div className="text-center py-10">
            <p className="text-red-600 font-semibold">
              Failed to load {recTitle.toLowerCase()}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {recError instanceof Error
                ? recError.message
                : 'An error occurred'}
            </p>
          </div>
        )}

        {recProducts && recProducts.length > 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {recProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {recProducts.length} products
            </div>
          </div>
        )}

        {recProducts && recProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">No products found</p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later for new products
            </p>
          </div>
        )}

        {/* Latest Products Section */}
        <div className="my-10 block">
          <SectionTitle title="Latest Products" />
        </div>

        {isLatestLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {isLatestError && (
          <div className="text-center py-10">
            <p className="text-red-600 font-semibold">
              Failed to load latest products
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {latestError instanceof Error
                ? latestError.message
                : 'An error occurred'}
            </p>
          </div>
        )}

        {latestData && latestData.products.length > 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {latestData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {latestData.products.length} products
            </div>
          </div>
        )}

        {latestData && latestData.products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">
              No latest products found
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later for new products
            </p>
          </div>
        )}

        {/* Top Shops Section */}
        <div className="my-10 block">
          <SectionTitle title="Top Shops" />
        </div>

        {isTopShopsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-[280px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {isTopShopsError && (
          <div className="text-center py-10">
            <p className="text-red-600 font-semibold">
              Failed to load top shops
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {topShopsError instanceof Error
                ? topShopsError.message
                : 'An error occurred'}
            </p>
          </div>
        )}

        {topShopsData && topShopsData.shops.length > 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {topShopsData.shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {topShopsData.shops.length} top-rated shops
            </div>
          </div>
        )}

        {topShopsData && topShopsData.shops.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">No top shops found</p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later for featured shops
            </p>
          </div>
        )}

        {/* Top Offers Section */}
        <div className="my-10 block">
          <SectionTitle title="Top Offers" />
        </div>

        {isTopOffersLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {isTopOffersError && (
          <div className="text-center py-10">
            <p className="text-red-600 font-semibold">
              Failed to load top offers
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {topOffersError instanceof Error
                ? topOffersError.message
                : 'An error occurred'}
            </p>
          </div>
        )}

        {topOffersData && topOffersData.products.length > 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {topOffersData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {topOffersData.products.length} special offers
            </div>
          </div>
        )}

        {topOffersData && topOffersData.products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">No offers available</p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later for special deals
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
