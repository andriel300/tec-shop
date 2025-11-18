'use client';

import React, { useState } from 'react';
import { Plus, X, Trash2, RefreshCw } from 'lucide-react';
import { Input } from '../core/Input';
import {
  ATTRIBUTE_SUGGESTIONS,
  SUGGESTION_CATEGORIES,
  COLOR_PALETTE,
  generateSKU,
  isColorAttribute,
  calculateCombinationCount,
  AttributeInput,
  VariantTable,
} from './variant-manager';

export interface ProductVariant {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  stock: number;
  isActive: boolean;
}

export interface VariantAttribute {
  name: string;
  values: string[];
}

export interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice: number;
  productName?: string;
  className?: string;
}

/**
 * VariantManager Component
 * Manages product variants with dynamic attributes (size, color, etc.)
 */
const VariantManager: React.FC<VariantManagerProps> = ({
  variants,
  onChange,
  basePrice,
  productName = 'Product',
  className = '',
}) => {
  const [attributes, setAttributes] = useState<VariantAttribute[]>([
    { name: 'Size', values: [] },
  ]);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState<
    Record<string, string>
  >({});
  const [showAttributeSuggestions, setShowAttributeSuggestions] =
    useState(false);

  // Filter suggestions based on input and already added attributes
  const filteredSuggestions = ATTRIBUTE_SUGGESTIONS.filter((suggestion) => {
    const alreadyAdded = attributes.some(
      (attr) => attr.name.toLowerCase() === suggestion.name.toLowerCase()
    );
    const matchesSearch = suggestion.name
      .toLowerCase()
      .includes(newAttributeName.toLowerCase());
    return !alreadyAdded && matchesSearch;
  });

  // Generate all possible variant combinations
  const generateVariants = () => {
    const activeAttributes = attributes.filter(
      (attr) => attr.values.length > 0
    );

    if (activeAttributes.length === 0) {
      onChange([]);
      return;
    }

    // Generate cartesian product of all attribute values
    const combinations: Record<string, string>[] = [{}];

    for (const attribute of activeAttributes) {
      const newCombinations: Record<string, string>[] = [];
      for (const combination of combinations) {
        for (const value of attribute.values) {
          newCombinations.push({
            ...combination,
            [attribute.name]: value,
          });
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    // Create variants from combinations
    const newVariants: ProductVariant[] = combinations.map((attrs) => {
      // Check if variant already exists
      const existingVariant = variants.find(
        (v) => JSON.stringify(v.attributes) === JSON.stringify(attrs)
      );

      if (existingVariant) {
        return existingVariant;
      }

      // Create new variant
      return {
        sku: generateSKU(productName, attrs),
        attributes: attrs,
        price: basePrice,
        stock: 0,
        isActive: true,
      };
    });

    onChange(newVariants);
  };

  // Add new attribute
  const addAttribute = (attributeName?: string) => {
    const nameToAdd = attributeName || newAttributeName;

    if (nameToAdd && !attributes.some((a) => a.name === nameToAdd)) {
      setAttributes([...attributes, { name: nameToAdd, values: [] }]);
      setNewAttributeName('');
      setShowAttributeSuggestions(false);
    }
  };

  // Select suggestion
  const selectSuggestion = (suggestionName: string) => {
    addAttribute(suggestionName);
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    const newAttrs = attributes.filter((_, i) => i !== index);
    setAttributes(newAttrs);
  };

  // Add value to attribute
  const addAttributeValue = (attributeIndex: number, directValue?: string) => {
    const attribute = attributes[attributeIndex];
    const value = directValue || newAttributeValue[attribute.name];

    if (value && !attribute.values.includes(value)) {
      const newAttrs = [...attributes];
      newAttrs[attributeIndex].values.push(value);
      setAttributes(newAttrs);
      setNewAttributeValue({ ...newAttributeValue, [attribute.name]: '' });
    }
  };

  // Remove value from attribute
  const removeAttributeValue = (attributeIndex: number, valueIndex: number) => {
    const newAttrs = [...attributes];
    newAttrs[attributeIndex].values.splice(valueIndex, 1);
    setAttributes(newAttrs);
  };

  // Update variant
  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: unknown
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    onChange(newVariants);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Options Configuration */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          Product Options
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Add options like Size, Color, or Material that customers can choose
          from
        </p>

        {/* Existing Options */}
        <div className="space-y-4 mb-4">
          {attributes.map((attribute, attrIndex) => (
            <div key={attrIndex} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  {attribute.name}
                </label>
                {attrIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => removeAttribute(attrIndex)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Option Values */}
              <div className="flex flex-wrap gap-2 mb-2">
                {attribute.values.map((value, valueIndex) => {
                  const colorData = isColorAttribute(attribute.name)
                    ? COLOR_PALETTE.find((c) => c.name === value)
                    : null;

                  return (
                    <span
                      key={valueIndex}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm"
                    >
                      {/* Show color swatch for color attributes */}
                      {colorData && (
                        <span
                          className="w-4 h-4 rounded-full border border-gray-600"
                          style={{ backgroundColor: colorData.hex }}
                          title={colorData.name}
                        />
                      )}
                      {value}
                      <button
                        type="button"
                        onClick={() =>
                          removeAttributeValue(attrIndex, valueIndex)
                        }
                        className="hover:text-blue-100"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Option Input (Color Picker or Text) */}
              <AttributeInput
                attributeName={attribute.name}
                selectedValues={attribute.values}
                inputValue={newAttributeValue[attribute.name] || ''}
                onInputChange={(value) =>
                  setNewAttributeValue({
                    ...newAttributeValue,
                    [attribute.name]: value,
                  })
                }
                onAddValue={(directValue) =>
                  addAttributeValue(attrIndex, directValue)
                }
              />
            </div>
          ))}
        </div>

        {/* Add New Option */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <Input
                variant="dark"
                placeholder="Add option (e.g., Color, Material)"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                onFocus={() => setShowAttributeSuggestions(true)}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowAttributeSuggestions(false), 200);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAttribute();
                  }
                }}
              />

              {/* Suggestions Dropdown */}
              {showAttributeSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {/* Group by category */}
                    {SUGGESTION_CATEGORIES.map((category) => {
                      const categoryItems = filteredSuggestions.filter(
                        (s) => s.category === category
                      );
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                            {category}
                          </div>
                          {categoryItems.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectSuggestion(suggestion.name)}
                              className="w-full px-3 py-2 text-left rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-300"
                            >
                              <span className="text-lg">{suggestion.icon}</span>
                              <span className="font-medium">
                                {suggestion.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Show "Add custom" hint if typing something not in suggestions */}
                  {newAttributeName && filteredSuggestions.length === 0 && (
                    <div className="p-3 text-sm text-gray-400 border-t border-gray-700">
                      Press Enter to add &quot;
                      <span className="text-blue-400 font-medium">
                        {newAttributeName}
                      </span>
                      &quot; as a custom option
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => addAttribute()}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              <Plus size={18} className="inline mr-1" />
              Add Option
            </button>
          </div>

          {/* Help text */}
          <p className="mt-2 text-xs text-gray-500">
            💡 Click the input to see common options or type your own custom
            option
          </p>
        </div>

        {/* Generate Variants Button */}
        <button
          type="button"
          onClick={generateVariants}
          className="mt-4 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          Generate Variants ({calculateCombinationCount(attributes)}{' '}
          combinations)
        </button>
      </div>

      {/* Variant Table */}
      <VariantTable
        variants={variants}
        onUpdateVariant={updateVariant}
        onRemoveVariant={removeVariant}
      />
    </div>
  );
};

VariantManager.displayName = 'VariantManager';

export { VariantManager };
