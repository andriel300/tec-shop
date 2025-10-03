'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, Plus, Loader2 } from 'lucide-react';
import { Input } from '../core/Input';

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
  value,
  onChange,
  onAttributesChange,
  className = '',
  variant = 'dark',
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);

  // Fetch categories from API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/categories');
      // const data = await response.json();

      // Mock data for now
      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          isActive: true,
          attributes: {
            warranty: { required: true, type: 'text' },
            brand: { required: true, type: 'select' },
          },
          children: [
            { id: '11', name: 'Smartphones', slug: 'smartphones', parentId: '1', isActive: true },
            { id: '12', name: 'Laptops', slug: 'laptops', parentId: '1', isActive: true },
          ],
        },
        {
          id: '2',
          name: 'Clothing',
          slug: 'clothing',
          isActive: true,
          attributes: {
            size: { required: true, type: 'select', values: ['S', 'M', 'L', 'XL'] },
            material: { required: true, type: 'text' },
          },
          children: [
            { id: '21', name: 'T-Shirts', slug: 't-shirts', parentId: '2', isActive: true },
            { id: '22', name: 'Jeans', slug: 'jeans', parentId: '2', isActive: true },
          ],
        },
        {
          id: '3',
          name: 'Home & Garden',
          slug: 'home-garden',
          isActive: true,
          children: [
            { id: '31', name: 'Furniture', slug: 'furniture', parentId: '3', isActive: true },
            { id: '32', name: 'Kitchen', slug: 'kitchen', parentId: '3', isActive: true },
          ],
        },
      ];

      setCategories(mockCategories);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Category fetch error:', err);
    } finally {
      setLoading(false);
    }
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
      const childrenMatch = cat.children && filterCategories(cat.children).length > 0;
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
      <div className={`p-4 bg-red-900/20 border border-red-700 rounded-lg ${className}`}>
        <p className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={fetchCategories}
          className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
        >
          Retry
        </button>
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
              {index > 0 && <ChevronRight size={14} className="text-gray-500" />}
              <span className="text-sm text-blue-400">{cat.name}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Search Input */}
      <Input
        variant={variant}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search categories..."
        className="mb-2"
      />

      {/* Category Tree */}
      <div className="max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-2">
        {renderCategories(categories)}
      </div>

      {/* Add New Category Button */}
      <button
        type="button"
        className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        onClick={() => {
          // TODO: Open modal to add new category
          console.log('Add new category');
        }}
      >
        <Plus size={18} />
        Add New Category
      </button>
    </div>
  );
};

CategorySelector.displayName = 'CategorySelector';

export { CategorySelector };
