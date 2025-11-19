import { useQuery } from '@tanstack/react-query';

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
      const response = await fetch('http://localhost:8080/api/categories/tree');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      return data as Category[];
    },
    staleTime: 10 * 60 * 1000, // Categories change infrequently, fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 3, // Retry failed requests 3 times
  });
}
