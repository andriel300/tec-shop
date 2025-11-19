/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Award, CheckCircle } from 'lucide-react';
import {
  useBrands,
  useCreateBrand,
  type Brand,
} from '../../../../hooks/useBrands';
import { Input } from 'libs/shared/components/input/src/lib/input';

export type { Brand };

export interface BrandSelectorProps {
  value: string;
  onChange: (brandId: string, brand?: Brand) => void;
  className?: string;
  variant?: 'default' | 'dark';
  required?: boolean;
}

/**
 * BrandSelector Component - Hybrid Autocomplete
 * Allows searching existing brands AND creating new brands on-the-fly
 *
 * Uses React Query for data fetching and caching
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
  required = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // React Query hooks
  const {
    data: brands = [] as Brand[],
    isLoading: loading,
    error: fetchError,
  } = useBrands();
  const { mutate: createBrand, isPending: creating } = useCreateBrand();

  const error = fetchError ? 'Failed to load brands.' : null;

  // Update selected brand when value changes
  useEffect(() => {
    if (value && brands.length > 0) {
      const brand = brands.find((b: Brand) => b.id === value);
      setSelectedBrand(brand || null);
      if (brand) {
        setSearchTerm(brand.name);
      }
    }
  }, [value, brands]);

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setSearchTerm(brand.name);
    setShowDropdown(false);
    onChange(brand.id, brand);
  };

  const handleClearSelection = () => {
    if (!required) {
      setSelectedBrand(null);
      setSearchTerm('');
      onChange('');
    }
  };

  const handleCreateBrand = (brandName: string) => {
    createBrand(
      {
        name: brandName,
        isActive: true,
      },
      {
        onSuccess: (newBrand: Brand) => {
          // Select the newly created brand
          handleBrandSelect(newBrand);
        },
      }
    );
  };

  // Filter brands by search term (case-insensitive)
  const filteredBrands = brands.filter((brand: Brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Check if search term matches any existing brand exactly
  const exactMatch = brands.find(
    (brand: Brand) =>
      brand.name.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  // Show "Create" option if there's a search term and no exact match
  const showCreateOption = searchTerm.trim() && !exactMatch;

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="animate-spin text-blue-500" size={24} />
        <span className="ml-2 text-gray-400">Loading brands...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Brand {required && <span className="text-red-400">*</span>}
      </label>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Autocomplete Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={18}
        />
        <Input
          variant="default"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search or create brand..."
          className="pl-10 pr-10"
        />
        {selectedBrand && (
          <CheckCircle
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400"
            size={18}
          />
        )}
      </div>

      {/* Dropdown with suggestions and create option */}
      {showDropdown && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-50 max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
            {/* Create new brand option */}
            {showCreateOption && (
              <button
                type="button"
                onClick={() => handleCreateBrand(searchTerm.trim())}
                disabled={creating}
                className="w-full text-left px-4 py-3 border-b border-gray-700 hover:bg-blue-900/30 transition-colors flex items-center gap-3 text-blue-400 font-medium"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating &quot;{searchTerm.trim()}&quot;...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Create &quot;{searchTerm.trim()}&quot;</span>
                  </>
                )}
              </button>
            )}

            {/* Existing brands */}
            {filteredBrands.length > 0 ? (
              <div className="divide-y divide-gray-700">
                {filteredBrands.map((brand: Brand) => (
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
                      className={
                        selectedBrand?.id === brand.id
                          ? 'text-white'
                          : 'text-gray-400'
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium">{brand.name}</p>
                      {brand.description && (
                        <p
                          className={`text-xs mt-0.5 ${
                            selectedBrand?.id === brand.id
                              ? 'text-blue-100'
                              : 'text-gray-400'
                          }`}
                        >
                          {brand.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : !showCreateOption ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No brands found. Start typing to create a new brand.
              </div>
            ) : null}
          </div>

          {/* Overlay to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        </div>
      )}

      {/* Selected brand info */}
      {selectedBrand && !showDropdown && (
        <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-blue-400" />
            <span className="text-sm text-blue-300">
              Selected:{' '}
              <span className="font-medium">{selectedBrand.name}</span>
            </span>
          </div>
          {!required && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-400">
        Type to search existing brands or create a new one instantly.
      </p>
    </div>
  );
};

BrandSelector.displayName = 'BrandSelector';

export { BrandSelector };
