'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { ChevronDown, ChevronUp, ImagePlus, X, Loader2 } from 'lucide-react';
import StarRating from '../ui/star-rating';
import { useAuth } from '../../contexts/auth-context';
import { useUserRating, useCreateOrUpdateRating } from '../../hooks/use-ratings';

interface ReviewFormProps {
  productId: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: existingRating } = useUserRating(productId, isAuthenticated);
  const createMutation = useCreateOrUpdateRating(productId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate form when existing rating loads
  const hasPopulated = useRef(false);
  if (existingRating && !hasPopulated.current) {
    hasPopulated.current = true;
    setRating(existingRating.rating);
    setTitle(existingRating.title || '');
    setContent(existingRating.content || '');
    if (existingRating.images?.length > 0) {
      setImagePreviews(existingRating.images);
    }
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - images.length;
    const toAdd = files.slice(0, remaining);

    setImages((prev) => [...prev, ...toAdd]);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (rating === 0) return;

    const formData = new FormData();
    formData.append('rating', String(rating));
    if (title.trim()) formData.append('title', title.trim());
    if (content.trim()) formData.append('content', content.trim());
    images.forEach((file) => formData.append('images', file));

    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsExpanded(false);
      },
    });
  };

  const isEditing = !!existingRating;

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            router.push('/login');
            return;
          }
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">
          {isEditing ? 'Edit your review' : 'Write a Review'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
          {/* Star rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Rating
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="review-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title (optional)
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="review-content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Review (optional)
            </label>
            <textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell others about your experience with this product"
              maxLength={2000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {content.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {content.length}/2000
              </p>
            )}
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos (optional, max 3)
            </label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative w-20 h-20">
                  <Image
                    src={preview}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageAdd}
                className="hidden"
              />
            </div>
          </div>

          {/* Error message */}
          {createMutation.isError && (
            <p className="text-sm text-red-600">
              {createMutation.error?.message || 'Failed to submit review. Please try again.'}
            </p>
          )}

          {/* Success message */}
          {createMutation.isSuccess && (
            <p className="text-sm text-green-600">
              Review submitted successfully!
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || createMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isEditing ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReviewForm;
