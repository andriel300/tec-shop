/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React, { useState } from 'react';
import { ChevronRight, Folder, Loader2 } from 'lucide-react';
import { useCategories, type Category } from '../../../../hooks/useCategories';
import { Input } from 'libs/shared/components/input/src/lib/input';

export type { Category };

export interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string, category?: Category) => void;
  onAttributesChange?: (attributes: Record<string, unknown>) => void;
  className?: string;
  variant?: 'default' | 'dark';
}

/**
 * CategorySelector Component
 * Hierarchical category selector with breadcrumb navigation
 *
 * Uses React Query for data fetching and caching
 *
 * @example
 * <CategorySelector
 *   value={categoryId}
 *   onChange={(id, category) => {
 *     setCategoryId(id);
 *     // Set dynamic attributes based on category
 *   }}
 *   onAttributesChange={setDynamicAttributes}
 * />
 */
const CategorySelector: React.FC<CategorySelectorProps> = ({
  onChange,
  onAttributesChange,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);

  // React Query hook
  const {
    data: categories = [],
    isLoading: loading,
    error: fetchError,
  } = useCategories();

  const error = fetchError ? 'Failed to load categories.' : null;

  // Helper function to find category by ID recursively
  const findCategoryById = (id: string, cats: Category[]): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryById(id, cat.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Build breadcrumb path
  const buildBreadcrumb = (category: Category): Category[] => {
    const path: Category[] = [category];
    let current = category;

    while (current.parentId) {
      const parent = findCategoryById(current.parentId, categories);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return path;
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setBreadcrumb(buildBreadcrumb(category));
    onChange(category.id, category);

    // Emit dynamic attributes for this category
    if (onAttributesChange && category.attributes) {
      onAttributesChange(category.attributes);
    }
  };

  // Filter categories by search term
  const filterCategories = (cats: Category[]): Category[] => {
    if (!searchTerm) return cats;

    return cats.filter((cat) => {
      const matches = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const childrenMatch =
        cat.children && filterCategories(cat.children).length > 0;
      return matches || childrenMatch;
    });
  };

  const renderCategories = (cats: Category[], level = 0) => {
    const filtered = filterCategories(cats);

    return filtered.map((category) => (
      <div key={category.id} className="mb-1">
        <button
          type="button"
          onClick={() => handleCategorySelect(category)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            selectedCategory?.id === category.id
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-700 text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          <Folder size={16} />
          <span>{category.name}</span>
          {category.children && category.children.length > 0 && (
            <ChevronRight size={14} className="ml-auto" />
          )}
        </button>

        {category.children && category.children.length > 0 && (
          <div className="mt-1">
            {renderCategories(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="animate-spin text-blue-500" size={24} />
        <span className="ml-2 text-gray-400">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 bg-red-900/20 border border-red-700 rounded-lg ${className}`}
      >
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Category Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
          <span className="text-sm text-gray-400">Selected:</span>
          {breadcrumb.map((cat, index) => (
            <React.Fragment key={cat.id}>
              {index > 0 && (
                <ChevronRight size={14} className="text-gray-500" />
              )}
              <span className="text-sm text-blue-400">{cat.name}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Search Input */}
      <Input
        variant="default"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search categories..."
        className="mb-2"
      />

      {/* Category Tree */}
      <div className="max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-2">
        {renderCategories(categories)}
      </div>

      {/* Info Message */}
      <p className="text-xs text-gray-500 text-center">
        Can&apos;t find your category? Contact support to request a new
        category.
      </p>
    </div>
  );
};

CategorySelector.displayName = 'CategorySelector';

export { CategorySelector };
