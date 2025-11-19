import { useQuery } from '@tanstack/react-query';
import { getCategories, buildCategoryTree } from '../lib/api/categories';
import type { Category, CategoriesFilters } from '../lib/api/categories';

/**
 * Hook to fetch categories from the API
 */
export const useCategories = (filters?: CategoriesFilters) => {
  return useQuery<Category[], Error>({
    queryKey: ['categories', filters],
    queryFn: () => getCategories(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

/**
 * Hook to fetch categories as a hierarchical tree
 */
export const useCategoryTree = (filters?: CategoriesFilters) => {
  return useQuery<Category[], Error>({
    queryKey: ['categories', 'tree', filters],
    queryFn: async () => {
      const categories = await getCategories(filters);
      return buildCategoryTree(categories);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
};
