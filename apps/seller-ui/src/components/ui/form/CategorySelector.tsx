'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, Loader2 } from 'lucide-react';
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

      // Mock data - Amazon-like category structure
      // TODO: Replace with actual API call to GET /api/seller/categories
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
            { id: '11', name: 'Smartphones & Accessories', slug: 'smartphones-accessories', parentId: '1', isActive: true },
            { id: '12', name: 'Computers & Laptops', slug: 'computers-laptops', parentId: '1', isActive: true },
            { id: '13', name: 'Cameras & Photography', slug: 'cameras-photography', parentId: '1', isActive: true },
            { id: '14', name: 'TV & Home Theater', slug: 'tv-home-theater', parentId: '1', isActive: true },
            { id: '15', name: 'Headphones & Audio', slug: 'headphones-audio', parentId: '1', isActive: true },
          ],
        },
        {
          id: '2',
          name: 'Clothing, Shoes & Jewelry',
          slug: 'clothing-shoes-jewelry',
          isActive: true,
          attributes: {
            size: { required: true, type: 'select', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
            color: { required: true, type: 'text' },
            material: { required: true, type: 'text' },
          },
          children: [
            { id: '21', name: "Men's Fashion", slug: 'mens-fashion', parentId: '2', isActive: true },
            { id: '22', name: "Women's Fashion", slug: 'womens-fashion', parentId: '2', isActive: true },
            { id: '23', name: "Kids' Fashion", slug: 'kids-fashion', parentId: '2', isActive: true },
            { id: '24', name: 'Shoes', slug: 'shoes', parentId: '2', isActive: true },
            { id: '25', name: 'Jewelry & Watches', slug: 'jewelry-watches', parentId: '2', isActive: true },
          ],
        },
        {
          id: '3',
          name: 'Home & Kitchen',
          slug: 'home-kitchen',
          isActive: true,
          children: [
            { id: '31', name: 'Furniture', slug: 'furniture', parentId: '3', isActive: true },
            { id: '32', name: 'Kitchen & Dining', slug: 'kitchen-dining', parentId: '3', isActive: true },
            { id: '33', name: 'Bedding & Bath', slug: 'bedding-bath', parentId: '3', isActive: true },
            { id: '34', name: 'Home Decor', slug: 'home-decor', parentId: '3', isActive: true },
            { id: '35', name: 'Storage & Organization', slug: 'storage-organization', parentId: '3', isActive: true },
          ],
        },
        {
          id: '4',
          name: 'Books & Media',
          slug: 'books-media',
          isActive: true,
          children: [
            { id: '41', name: 'Books', slug: 'books', parentId: '4', isActive: true },
            { id: '42', name: 'Movies & TV', slug: 'movies-tv', parentId: '4', isActive: true },
            { id: '43', name: 'Music', slug: 'music', parentId: '4', isActive: true },
            { id: '44', name: 'Video Games', slug: 'video-games', parentId: '4', isActive: true },
          ],
        },
        {
          id: '5',
          name: 'Sports & Outdoors',
          slug: 'sports-outdoors',
          isActive: true,
          children: [
            { id: '51', name: 'Exercise & Fitness', slug: 'exercise-fitness', parentId: '5', isActive: true },
            { id: '52', name: 'Outdoor Recreation', slug: 'outdoor-recreation', parentId: '5', isActive: true },
            { id: '53', name: 'Sports Equipment', slug: 'sports-equipment', parentId: '5', isActive: true },
            { id: '54', name: 'Camping & Hiking', slug: 'camping-hiking', parentId: '5', isActive: true },
          ],
        },
        {
          id: '6',
          name: 'Toys & Games',
          slug: 'toys-games',
          isActive: true,
          children: [
            { id: '61', name: 'Action Figures & Collectibles', slug: 'action-figures-collectibles', parentId: '6', isActive: true },
            { id: '62', name: 'Board Games & Puzzles', slug: 'board-games-puzzles', parentId: '6', isActive: true },
            { id: '63', name: 'Educational Toys', slug: 'educational-toys', parentId: '6', isActive: true },
            { id: '64', name: 'Dolls & Accessories', slug: 'dolls-accessories', parentId: '6', isActive: true },
          ],
        },
        {
          id: '7',
          name: 'Beauty & Personal Care',
          slug: 'beauty-personal-care',
          isActive: true,
          children: [
            { id: '71', name: 'Makeup', slug: 'makeup', parentId: '7', isActive: true },
            { id: '72', name: 'Skin Care', slug: 'skin-care', parentId: '7', isActive: true },
            { id: '73', name: 'Hair Care', slug: 'hair-care', parentId: '7', isActive: true },
            { id: '74', name: 'Fragrances', slug: 'fragrances', parentId: '7', isActive: true },
          ],
        },
        {
          id: '8',
          name: 'Automotive',
          slug: 'automotive',
          isActive: true,
          children: [
            { id: '81', name: 'Car Parts & Accessories', slug: 'car-parts-accessories', parentId: '8', isActive: true },
            { id: '82', name: 'Motorcycle & Powersports', slug: 'motorcycle-powersports', parentId: '8', isActive: true },
            { id: '83', name: 'Tools & Equipment', slug: 'tools-equipment', parentId: '8', isActive: true },
          ],
        },
        {
          id: '9',
          name: 'Baby Products',
          slug: 'baby-products',
          isActive: true,
          children: [
            { id: '91', name: 'Diapering', slug: 'diapering', parentId: '9', isActive: true },
            { id: '92', name: 'Nursery', slug: 'nursery', parentId: '9', isActive: true },
            { id: '93', name: 'Baby Care', slug: 'baby-care', parentId: '9', isActive: true },
            { id: '94', name: 'Strollers & Car Seats', slug: 'strollers-car-seats', parentId: '9', isActive: true },
          ],
        },
        {
          id: '10',
          name: 'Pet Supplies',
          slug: 'pet-supplies',
          isActive: true,
          children: [
            { id: '101', name: 'Dog Supplies', slug: 'dog-supplies', parentId: '10', isActive: true },
            { id: '102', name: 'Cat Supplies', slug: 'cat-supplies', parentId: '10', isActive: true },
            { id: '103', name: 'Fish & Aquatic Pets', slug: 'fish-aquatic-pets', parentId: '10', isActive: true },
            { id: '104', name: 'Bird Supplies', slug: 'bird-supplies', parentId: '10', isActive: true },
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

      {/* Info Message */}
      <p className="text-xs text-gray-500 text-center">
        Can't find your category? Contact support to request a new category.
      </p>
    </div>
  );
};

CategorySelector.displayName = 'CategorySelector';

export { CategorySelector };
