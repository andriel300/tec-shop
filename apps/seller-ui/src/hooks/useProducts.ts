import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getProducts, deleteProduct, type ProductResponse } from '../lib/api/products';

/**
 * Query Keys for TanStack Query
 * Centralized keys prevent typos and make invalidation easier
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: { search?: string; category?: string; isActive?: boolean }) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

/**
 * Hook: Fetch all products
 *
 * Features:
 * - Automatic caching (data persists between component mounts)
 * - Background refetching on window focus
 * - Automatic retry on failure (3 times with exponential backoff)
 * - Loading and error states
 * - Support for search and filter parameters
 *
 * @param filters - Optional filters (search, category, isActive)
 */
export function useProducts(filters?: { search?: string; category?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
  });
}

/**
 * Hook: Delete a product
 *
 * Features:
 * - Optimistic updates (removes from UI before server confirms)
 * - Automatic cache invalidation
 * - Success/error toast notifications
 * - Loading state
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onMutate: async (productId: string) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData<ProductResponse[]>(productKeys.lists());

      // Optimistically remove from cache
      queryClient.setQueriesData<ProductResponse[]>(
        { queryKey: productKeys.lists() },
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter((product) => product.id !== productId);
        }
      );

      // Return context with snapshot
      return { previousProducts };
    },
    onSuccess: (_data, productId: string) => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });

      toast.success('Product deleted successfully!');
    },
    onError: (error: Error, _productId, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.lists(), context.previousProducts);
      }

      toast.error('Failed to delete product', {
        description: error.message,
      });
    },
  });
}
