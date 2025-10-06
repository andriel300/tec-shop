'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Award, CheckCircle } from 'lucide-react';
import { Input } from '../core/Input';
import apiClient from '../../../lib/api/client';

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
 * BrandSelector Component - Hybrid Autocomplete
 * Allows searching existing brands AND creating new brands on-the-fly
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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch brands from API
  useEffect(() => {
    fetchBrands();
  }, []);

  // Update selected brand when value changes
  useEffect(() => {
    if (value && brands.length > 0) {
      const brand = brands.find((b) => b.id === value);
      setSelectedBrand(brand || null);
      if (brand) {
        setSearchTerm(brand.name);
      }
    }
  }, [value, brands]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/brands');
      const data = response.data;

      // Handle both array and object with brands array
      const brandsArray = Array.isArray(data) ? data : data.brands || [];
      setBrands(brandsArray);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('Failed to load brands.');
      setLoading(false);
    }
  };

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

  const handleCreateBrand = async (brandName: string) => {
    try {
      setCreating(true);
      setError(null);

      // Create brand via API
      const response = await apiClient.post('/brands', {
        name: brandName,
        isActive: true,
      });

      const newBrand = response.data;

      // Add to local brands list
      setBrands([...brands, newBrand]);

      // Select the newly created brand
      handleBrandSelect(newBrand);

      setCreating(false);
    } catch (err: unknown) {
      console.error('Error creating brand:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to create brand');
      } else {
        setError('Failed to create brand');
      }
      setCreating(false);
    }
  };

  // Filter brands by search term (case-insensitive)
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Check if search term matches any existing brand exactly
  const exactMatch = brands.find(
    (brand) => brand.name.toLowerCase() === searchTerm.toLowerCase().trim()
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
          variant={variant}
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
              Selected: <span className="font-medium">{selectedBrand.name}</span>
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
