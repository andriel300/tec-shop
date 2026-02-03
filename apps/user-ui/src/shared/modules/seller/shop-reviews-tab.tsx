'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Loader2, User } from 'lucide-react';
import { getPublicProducts } from '../../../lib/api/products';

interface ShopReviewsTabProps {
  shopId: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

const ShopReviewsTab: React.FC<ShopReviewsTabProps> = ({ shopId }) => {
  // Fetch all products to calculate aggregate ratings
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['shop-products-for-reviews', shopId],
    queryFn: () => getPublicProducts({ shopId, limit: 100 }),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!shopId,
  });

  // Calculate aggregate review stats from products
  const reviewSummary: ReviewSummary | null = React.useMemo(() => {
    if (!productsData?.products || productsData.products.length === 0) {
      return null;
    }

    let totalRating = 0;
    let totalReviews = 0;
    const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    productsData.products.forEach((product) => {
      if (product.ratingCount > 0) {
        totalRating += product.averageRating * product.ratingCount;
        totalReviews += product.ratingCount;

        // Estimate distribution based on average (simplified)
        const avgRound = Math.round(product.averageRating);
        distribution[avgRound] = (distribution[avgRound] || 0) + product.ratingCount;
      }
    });

    if (totalReviews === 0) return null;

    return {
      averageRating: totalRating / totalReviews,
      totalReviews,
      ratingDistribution: distribution,
    };
  }, [productsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!reviewSummary) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Star className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          This shop hasn&apos;t received any reviews yet. Be the first to share your experience!
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(reviewSummary.ratingDistribution));

  return (
    <div className="py-6">
      {/* Rating Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">
              {reviewSummary.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(reviewSummary.averageRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Based on {reviewSummary.totalReviews.toLocaleString()} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 w-full max-w-md">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewSummary.ratingDistribution[rating] || 0;
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3 mb-2">
                  <span className="flex items-center gap-1 text-sm text-gray-600 w-12">
                    {rating}
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products with Ratings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Product Ratings
        </h3>
        <div className="space-y-4">
          {productsData?.products
            .filter((p) => p.ratingCount > 0)
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 10)
            .map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(product.averageRating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.averageRating.toFixed(1)} ({product.ratingCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ShopReviewsTab;
