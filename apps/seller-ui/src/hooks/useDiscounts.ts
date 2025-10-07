import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateDiscountData,
  DiscountResponse,
  UpdateDiscountData,
} from '../lib/api/discounts';
import {
  createDiscount,
  deleteDiscount,
  getDiscount,
  getDiscounts,
  updateDiscount,
} from '../lib/api/discounts';

/**
 * Query Keys for TanStack Query
 * Centralized keys prevent typos and make invalidation easier
 */
export const discountKeys = {
  all: ['discounts'] as const,
  lists: () => [...discountKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...discountKeys.lists(), filters] as const,
  details: () => [...discountKeys.all, 'detail'] as const,
  detail: (id: string) => [...discountKeys.details(), id] as const,
};

/**
 * Hook: Fetch all discount codes
 *
 * Features:
 * - Automatic caching (data persists between component mounts)
 * - Background refetching on window focus
 * - Automatic retry on failure (3 times with exponential backoff)
 * - Loading and error states
 */
export function useDiscounts() {
  return useQuery({
    queryKey: discountKeys.lists(),
    queryFn: getDiscounts,
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook: Fetch a single discount code by ID
 *
 * @param id - Discount code ID
 * @param enabled - Whether to run the query (useful for conditional fetching)
 */
export function useDiscount(id: string, enabled = true) {
  return useQuery({
    queryKey: discountKeys.detail(id),
    queryFn: () => getDiscount(id),
    enabled: enabled && !!id, // Only fetch if enabled and id exists
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Create a new discount code
 *
 * Features:
 * - Optimistic updates (UI updates before server confirms)
 * - Automatic cache invalidation
 * - Success/error toast notifications
 * - Loading state
 */
export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDiscount,
    onSuccess: (newDiscount: DiscountResponse) => {
      // Invalidate and refetch discount list
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });

      // Optionally add to cache immediately (optimistic update)
      queryClient.setQueryData<DiscountResponse[]>(
        discountKeys.lists(),
        (oldData) => {
          if (!oldData) return [newDiscount];
          return [newDiscount, ...oldData]; // Add to beginning of list
        }
      );

      toast.success('Discount code created successfully!', {
        description: `Code: ${newDiscount.code}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create discount code', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook: Update an existing discount code
 *
 * @param id - Discount code ID to update
 */
export function useUpdateDiscount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDiscountData) => updateDiscount(id, data),
    onSuccess: (updatedDiscount: DiscountResponse) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: discountKeys.detail(id) });

      // Update the detail cache immediately
      queryClient.setQueryData(discountKeys.detail(id), updatedDiscount);

      // Update the list cache immediately
      queryClient.setQueryData<DiscountResponse[]>(
        discountKeys.lists(),
        (oldData) => {
          if (!oldData) return [updatedDiscount];
          return oldData.map((discount) =>
            discount.id === id ? updatedDiscount : discount
          );
        }
      );

      toast.success('Discount code updated successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to update discount code', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook: Delete a discount code
 */
export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDiscount,
    onSuccess: (_data, deletedId: string) => {
      // Remove from list cache immediately
      queryClient.setQueryData<DiscountResponse[]>(
        discountKeys.lists(),
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter((discount) => discount.id !== deletedId);
        }
      );

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: discountKeys.detail(deletedId) });

      toast.success('Discount code deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete discount code', {
        description: error.message,
      });
    },
  });
}
