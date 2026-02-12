'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import StarRating from '../ui/star-rating';
import { useProductReviews } from '../../hooks/use-ratings';
import type { Rating } from '../../lib/api/products';

interface ReviewListProps {
  productId: string;
}

// ============================================
// Rating Summary
// ============================================

function RatingSummary({
  averageRating,
  ratingCount,
  ratingDistribution,
}: {
  averageRating: number;
  ratingCount: number;
  ratingDistribution: Record<string, number>;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-gray-200">
      {/* Average rating */}
      <div className="flex flex-col items-center justify-center min-w-[120px]">
        <span className="text-4xl font-bold text-gray-900">
          {averageRating.toFixed(1)}
        </span>
        <StarRating value={averageRating} readonly size="md" />
        <span className="text-sm text-gray-500 mt-1">
          {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[String(star)] || 0;
          const percentage = ratingCount > 0 ? (count / ratingCount) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-6 text-right">
                {star}
              </span>
              <StarRating value={star} readonly size="sm" />
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Single Review Card
// ============================================

function ReviewCard({ review }: { review: Rating }) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const initials = (review.reviewerName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      {/* Header: avatar + name + date */}
      <div className="flex items-center gap-3 mb-2">
        {review.reviewerAvatar ? (
          <Image
            src={review.reviewerAvatar}
            alt={review.reviewerName || 'Reviewer'}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {review.reviewerName || 'Anonymous'}
          </p>
          <p className="text-xs text-gray-400">{reviewDate}</p>
        </div>
      </div>

      {/* Star rating */}
      <StarRating value={review.rating} readonly size="sm" />

      {/* Title */}
      {review.title && (
        <p className="font-semibold text-gray-900 mt-2">{review.title}</p>
      )}

      {/* Content */}
      {review.content && (
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          {review.content}
        </p>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setExpandedImage(img)}
              className="relative w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
            >
              <Image
                src={img}
                alt={`Review image ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-2xl max-h-[80vh]">
            <Image
              src={expandedImage}
              alt="Review image"
              width={800}
              height={600}
              className="object-contain rounded-lg max-h-[80vh] w-auto"
            />
          </div>
        </div>
      )}

      {/* Seller response */}
      {review.sellerResponse && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-blue-200 bg-blue-50/50 py-2 pr-3 rounded-r-md">
          <p className="text-xs font-semibold text-blue-700 mb-1">
            Seller response
          </p>
          <p className="text-sm text-gray-700">{review.sellerResponse}</p>
          {review.sellerResponseAt && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(review.sellerResponseAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Review List Component
// ============================================

const ReviewList: React.FC<ReviewListProps> = ({ productId }) => {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const { data, isLoading, isError } = useProductReviews(
    productId,
    page,
    10,
    sort
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-center text-gray-500 py-10">
        Failed to load reviews.
      </p>
    );
  }

  const { reviews, total, averageRating, ratingCount, ratingDistribution } =
    data;
  const hasMore = page * 10 < total;

  return (
    <div className="space-y-6">
      {/* Rating summary */}
      {ratingCount > 0 && (
        <RatingSummary
          averageRating={averageRating}
          ratingCount={ratingCount}
          ratingDistribution={ratingDistribution}
        />
      )}

      {/* Sort controls */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {reviews.length} of {total} reviews
          </p>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as 'newest' | 'highest' | 'lowest');
              setPage(1);
            }}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <div>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">
          No reviews yet. Be the first to share your experience!
        </p>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            Show more reviews
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
