import { useQuery } from '@tanstack/react-query';
import {
  getRecommendations,
  getPopularProducts,
  getSimilarProducts,
} from '../lib/api/recommendations';
import type { RecommendedProduct } from '../lib/api/recommendations';

export const useRecommendations = (limit?: number, enabled = true) => {
  return useQuery<RecommendedProduct[], Error>({
    queryKey: ['recommendations', { limit }],
    queryFn: () => getRecommendations(limit),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePopularProducts = (limit?: number, enabled = true) => {
  return useQuery<RecommendedProduct[], Error>({
    queryKey: ['recommendations', 'popular', { limit }],
    queryFn: () => getPopularProducts(limit),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSimilarProducts = (productId: string, limit?: number) => {
  return useQuery<RecommendedProduct[], Error>({
    queryKey: ['recommendations', 'similar', productId, { limit }],
    queryFn: () => getSimilarProducts(productId, limit),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
