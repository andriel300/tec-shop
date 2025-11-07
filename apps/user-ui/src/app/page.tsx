'use client';

import React from 'react';
import Hero from '../shared/modules/hero';
import SectionTitle from '../components/section/section-title';
import ProductCard from '../components/cards/product-card';
import { useQuery } from '@tanstack/react-query';
import { getPublicProducts } from '../lib/api/products';

const Page = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', { limit: 15, sort: 'newest' }],
    queryFn: () =>
      getPublicProducts({
        limit: 15,
        sort: 'newest',
      }),
  });

  return (
    <div className="bg-[#f5f5f5]">
      <Hero />
      <div className="md:w-[80%] w-[90%] my-10 m-auto">
        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-10">
            <p className="text-red-600 font-semibold">
              Failed to load products
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        )}

        {data && data.products.length > 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {data.products.length} of {data.total} products
            </div>
          </div>
        )}

        {data && data.products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 font-semibold">No products found</p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later for new products
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
