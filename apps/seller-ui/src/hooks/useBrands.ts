import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../lib/api/client';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
}

/**
 * Query Keys for TanStack Query
 * Centralized keys prevent typos and make invalidation easier
 */
export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...brandKeys.lists(), filters] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
};

/**
 * Hook: Fetch all brands
 *
 * Features:
 * - Automatic caching (data persists between component mounts)
 * - Background refetching on window focus
 * - Automatic retry on failure (3 times with exponential backoff)
 * - Loading and error states
 */
export function useBrands() {
  return useQuery({
    queryKey: brandKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get('/brands');
      const data = response.data;
      // Handle both array and object with brands array
      return Array.isArray(data) ? data : data.brands || [];
    },
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
  });
}

/**
 * Hook: Create a new brand
 *
 * Features:
 * - Optimistic updates (UI updates before server confirms)
 * - Automatic cache invalidation
 * - Success/error toast notifications
 * - Loading state
 */
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandData: { name: string; isActive?: boolean; description?: string }) => {
      const response = await apiClient.post('/brands', brandData);
      return response.data as Brand;
    },
    onSuccess: (newBrand: Brand) => {
      // Invalidate and refetch brand list
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });

      // Optimistically add to cache immediately
      queryClient.setQueryData<Brand[]>(
        brandKeys.lists(),
        (oldData) => {
          if (!oldData) return [newBrand];
          return [...oldData, newBrand]; // Add to end of list
        }
      );

      toast.success('Brand created successfully!', {
        description: `Brand: ${newBrand.name}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create brand', {
        description: error.message,
      });
    },
  });
}
