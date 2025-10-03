'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Award } from 'lucide-react';
import { Input } from '../core/Input';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
}

export interface BrandSelectorProps {
  value: string;
  onChange: (brandId: string, brand?: Brand) => void;
  className?: string;
  variant?: 'default' | 'dark';
  required?: boolean;
}

/**
 * BrandSelector Component
 * Searchable brand selector with "Add new brand" functionality
 *
 * @example
 * <BrandSelector
 *   value={brandId}
 *   onChange={(id, brand) => {
 *     setBrandId(id);
 *   }}
 *   required
 * />
 */
const BrandSelector: React.FC<BrandSelectorProps> = ({
  value,
  onChange,
  className = '',
  variant = 'dark',
  required = false,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Fetch brands from API
  useEffect(() => {
    fetchBrands();
  }, []);

  // Update selected brand when value changes
  useEffect(() => {
    if (value && brands.length > 0) {
      const brand = brands.find((b) => b.id === value);
      setSelectedBrand(brand || null);
    }
  }, [value, brands]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/brands');
      // const data = await response.json();

      // Mock data for now
      const mockBrands: Brand[] = [
        {
          id: '1',
          name: 'Apple',
          slug: 'apple',
          description: 'Premium electronics and technology',
          website: 'https://apple.com',
          isActive: true,
        },
        {
          id: '2',
          name: 'Samsung',
          slug: 'samsung',
          description: 'Electronics and appliances',
          website: 'https://samsung.com',
          isActive: true,
        },
        {
          id: '3',
          name: 'Nike',
          slug: 'nike',
          description: 'Sports and athletic wear',
          website: 'https://nike.com',
          isActive: true,
        },
        {
          id: '4',
          name: 'Adidas',
          slug: 'adidas',
          description: 'Sports and lifestyle brand',
          website: 'https://adidas.com',
          isActive: true,
        },
        {
          id: '5',
          name: 'Sony',
          slug: 'sony',
          description: 'Electronics and entertainment',
          website: 'https://sony.com',
          isActive: true,
        },
        {
          id: '6',
          name: 'Dell',
          slug: 'dell',
          description: 'Computers and technology',
          website: 'https://dell.com',
          isActive: true,
        },
        {
          id: '7',
          name: 'HP',
          slug: 'hp',
          description: 'Computers and printers',
          website: 'https://hp.com',
          isActive: true,
        },
        {
          id: '8',
          name: 'LG',
          slug: 'lg',
          description: 'Electronics and appliances',
          website: 'https://lg.com',
          isActive: true,
        },
      ];

      setBrands(mockBrands);
    } catch (err) {
      setError('Failed to load brands');
      console.error('Brand fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    onChange(brand.id, brand);
  };

  const handleClearSelection = () => {
    if (!required) {
      setSelectedBrand(null);
      onChange('');
    }
  };

  // Filter brands by search term
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="animate-spin text-blue-500" size={24} />
        <span className="ml-2 text-gray-400">Loading brands...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-900/20 border border-red-700 rounded-lg ${className}`}>
        <p className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={fetchBrands}
          className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Brand {required && <span className="text-red-400">*</span>}
      </label>

      {/* Selected Brand Display */}
      {selectedBrand && (
        <div className="flex items-center justify-between p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-300">{selectedBrand.name}</p>
              {selectedBrand.description && (
                <p className="text-xs text-gray-400">{selectedBrand.description}</p>
              )}
            </div>
          </div>
          {!required && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          variant={variant}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search brands..."
          className="pl-10"
        />
      </div>

      {/* Brand List */}
      <div className="max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg">
        {filteredBrands.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">No brands found</p>
            {searchTerm && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredBrands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => handleBrandSelect(brand)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                  selectedBrand?.id === brand.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <Award
                  size={16}
                  className={selectedBrand?.id === brand.id ? 'text-white' : 'text-gray-400'}
                />
                <div className="flex-1">
                  <p className="font-medium">{brand.name}</p>
                  {brand.description && (
                    <p className={`text-xs mt-0.5 ${
                      selectedBrand?.id === brand.id ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {brand.description}
                    </p>
                  )}
                </div>
                {brand.website && (
                  <span className="text-xs text-gray-500">
                    {new URL(brand.website).hostname}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add New Brand Button */}
      <button
        type="button"
        className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        onClick={() => {
          // TODO: Open modal to add new brand
          console.log('Add new brand');
        }}
      >
        <Plus size={18} />
        Add New Brand
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-400">
        Select a brand for your product. This helps customers find products from their favorite brands.
      </p>
    </div>
  );
};

BrandSelector.displayName = 'BrandSelector';

export { BrandSelector };
