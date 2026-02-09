import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../lib/api/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  attributes?: Record<string, unknown>;
  image?: string;
  isActive: boolean;
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  isActive?: boolean;
}

/**
 * Query Keys for TanStack Query
 * Centralized keys prevent typos and make invalidation easier
 */
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

/**
 * Hook: Fetch categories as a tree structure
 *
 * Features:
 * - Automatic caching (data persists between component mounts)
 * - Background refetching on window focus
 * - Automatic retry on failure (3 times with exponential backoff)
 * - Loading and error states
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: async () => {
      const response = await apiClient.get('/categories/tree');
      return response.data as Category[];
    },
    staleTime: 10 * 60 * 1000, // Categories change infrequently, fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 3, // Retry failed requests 3 times
  });
}

/**
 * Hook: Create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const response = await apiClient.post('/categories', categoryData);
      return response.data as Category;
    },
    onSuccess: (newCategory: Category) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Category created successfully!', {
        description: `Category: ${newCategory.name}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create category', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook: Update an existing category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCategoryData;
    }) => {
      const response = await apiClient.put(`/categories/${id}`, data);
      return response.data as Category;
    },
    onSuccess: (updatedCategory: Category) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Category updated successfully!', {
        description: `Category: ${updatedCategory.name}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update category', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook: Delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Category deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category', {
        description: error.message,
      });
    },
  });
}
