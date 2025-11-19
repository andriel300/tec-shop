import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export interface CategoriesFilters {
  onlyActive?: boolean;
  includeChildren?: boolean;
}

/**
 * Fetch all categories from the public API
 */
export const getCategories = async (filters?: CategoriesFilters): Promise<Category[]> => {
  const params = new URLSearchParams();

  if (filters?.onlyActive !== undefined) {
    params.append('onlyActive', String(filters.onlyActive));
  }

  if (filters?.includeChildren !== undefined) {
    params.append('includeChildren', String(filters.includeChildren));
  }

  const queryString = params.toString();
  const url = queryString ? `/categories?${queryString}` : '/categories';

  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Build a hierarchical category tree from flat category list
 */
export const buildCategoryTree = (categories: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: create a map of all categories
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build the tree structure
  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id);
    if (!categoryWithChildren) return;

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  // Sort by position
  const sortByPosition = (cats: Category[]) => {
    cats.sort((a, b) => a.position - b.position);
    cats.forEach((cat) => {
      if (cat.children && cat.children.length > 0) {
        sortByPosition(cat.children);
      }
    });
  };

  sortByPosition(rootCategories);
  return rootCategories;
};
