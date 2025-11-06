import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getDeletedProducts,
  restoreProduct,
  type ProductResponse,
  type UpdateProductData,
} from '../lib/api/products';

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
  trash: () => [...productKeys.all, 'trash'] as const,
  deletedList: (filters?: { search?: string; category?: string }) =>
    [...productKeys.trash(), filters] as const,
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
 * Hook: Fetch a single product by ID
 *
 * Features:
 * - Automatic caching
 * - Background refetching on window focus
 * - Loading and error states
 *
 * @param id - Product ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
    enabled: !!id, // Only fetch if ID exists
  });
}

/**
 * Hook: Update a product
 *
 * Features:
 * - Optimistic updates (updates UI before server confirms)
 * - Automatic cache invalidation
 * - Success/error toast notifications
 * - Loading state
 * - Supports both existing ImageKit URLs and new file uploads
 *
 * @param id - Product ID
 */
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: UpdateProductData) => updateProduct(id, productData),
    onMutate: async (productData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot previous values
      const previousProduct = queryClient.getQueryData<ProductResponse>(productKeys.detail(id));
      const previousProducts = queryClient.getQueryData<ProductResponse[]>(productKeys.lists());

      // Optimistically update detail cache
      if (previousProduct) {
        queryClient.setQueryData<ProductResponse>(productKeys.detail(id), {
          ...previousProduct,
          ...productData,
        } as ProductResponse);
      }

      // Return context with snapshots
      return { previousProduct, previousProducts };
    },
    onSuccess: (updatedProduct) => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });

      toast.success('Product updated successfully!', {
        description: updatedProduct.name,
      });
    },
    onError: (error: Error, _productData, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(id), context.previousProduct);
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.lists(), context.previousProducts);
      }

      toast.error('Failed to update product', {
        description: error.message,
      });
    },
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
      queryClient.invalidateQueries({ queryKey: productKeys.trash() });

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

/**
 * Hook: Fetch deleted products (trash)
 *
 * Features:
 * - Automatic caching (data persists between component mounts)
 * - Background refetching on window focus
 * - Automatic retry on failure (3 times with exponential backoff)
 * - Loading and error states
 * - Support for search and category filter parameters
 *
 * @param filters - Optional filters (search, category)
 */
export function useDeletedProducts(filters?: { search?: string; category?: string }) {
  return useQuery({
    queryKey: productKeys.deletedList(filters),
    queryFn: () => getDeletedProducts(filters),
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 minute (trash changes less frequently)
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
}

/**
 * Hook: Restore a deleted product
 *
 * Features:
 * - Optimistic updates (adds to active products list before server confirms)
 * - Automatic cache invalidation
 * - Success/error toast notifications
 * - Loading state
 */
export function useRestoreProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreProduct,
    onMutate: async (productId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.trash() });
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot previous values
      const previousDeleted = queryClient.getQueryData<ProductResponse[]>(productKeys.trash());

      // Optimistically remove from trash cache
      queryClient.setQueriesData<ProductResponse[]>(
        { queryKey: productKeys.trash() },
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter((product) => product.id !== productId);
        }
      );

      // Return context with snapshot
      return { previousDeleted };
    },
    onSuccess: (restoredProduct) => {
      // Invalidate all product queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: productKeys.trash() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(restoredProduct.id) });

      toast.success('Product restored successfully!', {
        description: restoredProduct.name,
      });
    },
    onError: (error: Error, _productId, context) => {
      // Rollback on error
      if (context?.previousDeleted) {
        queryClient.setQueryData(productKeys.trash(), context.previousDeleted);
      }

      toast.error('Failed to restore product', {
        description: error.message,
      });
    },
  });
}
