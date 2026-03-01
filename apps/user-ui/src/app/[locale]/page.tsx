'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('HomePage');
  const tCommon = useTranslations('Common');
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
  const recTitle = user ? t('recommendedForYou') : t('popularProducts');

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
              {t('failedToLoadRec')}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {recError instanceof Error
                ? recError.message
                : tCommon('anErrorOccurred')}
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
              {t('showingProducts', { count: recProducts.length })}
            </div>
          </div>
        )}

        {recProducts && recProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">{t('noProductsFound')}</p>
            <p className="text-gray-500 text-sm mt-2">
              {t('checkBackProducts')}
            </p>
          </div>
        )}

        {/* Latest Products Section */}
        <div className="my-10 block">
          <SectionTitle title={t('latestProducts')} />
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
              {t('failedToLoadLatest')}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {latestError instanceof Error
                ? latestError.message
                : tCommon('anErrorOccurred')}
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
              {t('showingProducts', { count: latestData.products.length })}
            </div>
          </div>
        )}

        {latestData && latestData.products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">{t('noProductsFound')}</p>
            <p className="text-gray-500 text-sm mt-2">
              {t('checkBackProducts')}
            </p>
          </div>
        )}

        {/* Top Shops Section */}
        <div className="my-10 block">
          <SectionTitle title={t('topShops')} />
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
              {t('failedToLoadShops')}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {topShopsError instanceof Error
                ? topShopsError.message
                : tCommon('anErrorOccurred')}
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
              {t('showingShops', { count: topShopsData.shops.length })}
            </div>
          </div>
        )}

        {topShopsData && topShopsData.shops.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">{t('noShopsFound')}</p>
            <p className="text-gray-500 text-sm mt-2">
              {t('checkBackShops')}
            </p>
          </div>
        )}

        {/* Top Offers Section */}
        <div className="my-10 block">
          <SectionTitle title={t('topOffers')} />
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
              {t('failedToLoadOffers')}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {topOffersError instanceof Error
                ? topOffersError.message
                : tCommon('anErrorOccurred')}
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
              {t('showingOffers', { count: topOffersData.products.length })}
            </div>
          </div>
        )}

        {topOffersData && topOffersData.products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">{t('noOffersAvailable')}</p>
            <p className="text-gray-500 text-sm mt-2">
              {t('checkBackDeals')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
