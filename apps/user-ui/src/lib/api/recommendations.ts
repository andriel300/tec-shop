import { apiClient } from './client';
import type { Product } from './products';

export type RecommendedProduct = Product & {
  score: number;
};

export const getRecommendations = async (
  limit?: number
): Promise<RecommendedProduct[]> => {
  const response = await apiClient.get('/recommendations', {
    params: limit ? { limit } : undefined,
  });
  return response.data;
};

export const getPopularProducts = async (
  limit?: number
): Promise<RecommendedProduct[]> => {
  const response = await apiClient.get('/recommendations/popular', {
    params: limit ? { limit } : undefined,
  });
  return response.data;
};

export const getSimilarProducts = async (
  productId: string,
  limit?: number
): Promise<RecommendedProduct[]> => {
  const response = await apiClient.get(`/recommendations/similar/${productId}`, {
    params: limit ? { limit } : undefined,
  });
  return response.data;
};
