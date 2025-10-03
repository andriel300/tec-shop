'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, RefreshCw } from 'lucide-react';
import { Input } from '../core/Input';

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
 *
 * @example
 * <VariantManager
 *   variants={variants}
 *   onChange={setVariants}
 *   basePrice={29.99}
 *   productName="T-Shirt"
 * />
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
  const [newAttributeValue, setNewAttributeValue] = useState<Record<string, string>>({});

  // Generate SKU from product name and attributes
  const generateSKU = (attrs: Record<string, string>): string => {
    const prefix = productName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);

    const suffix = Object.values(attrs)
      .map(val => val.substring(0, 2).toUpperCase())
      .join('-');

    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${suffix}-${timestamp}`;
  };

  // Generate all possible variant combinations
  const generateVariants = () => {
    const activeAttributes = attributes.filter(attr => attr.values.length > 0);

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
    const newVariants: ProductVariant[] = combinations.map(attrs => {
      // Check if variant already exists
      const existingVariant = variants.find(v =>
        JSON.stringify(v.attributes) === JSON.stringify(attrs)
      );

      if (existingVariant) {
        return existingVariant;
      }

      // Create new variant
      return {
        sku: generateSKU(attrs),
        attributes: attrs,
        price: basePrice,
        stock: 0,
        isActive: true,
      };
    });

    onChange(newVariants);
  };

  // Add new attribute
  const addAttribute = () => {
    if (newAttributeName && !attributes.some(a => a.name === newAttributeName)) {
      setAttributes([...attributes, { name: newAttributeName, values: [] }]);
      setNewAttributeName('');
    }
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    const newAttrs = attributes.filter((_, i) => i !== index);
    setAttributes(newAttrs);
  };

  // Add value to attribute
  const addAttributeValue = (attributeIndex: number) => {
    const attribute = attributes[attributeIndex];
    const value = newAttributeValue[attribute.name];

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
  const updateVariant = (index: number, field: keyof ProductVariant, value: unknown) => {
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
      {/* Attribute Configuration */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          Configure Variant Attributes
        </h3>

        {/* Existing Attributes */}
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

              {/* Attribute Values */}
              <div className="flex flex-wrap gap-2 mb-2">
                {attribute.values.map((value, valueIndex) => (
                  <span
                    key={valueIndex}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm"
                  >
                    {value}
                    <button
                      type="button"
                      onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                      className="hover:text-blue-100"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Value Input */}
              <div className="flex gap-2">
                <Input
                  variant="dark"
                  placeholder={`Add ${attribute.name.toLowerCase()} option (e.g., ${attribute.name === 'Size' ? 'M, L, XL' : 'Red, Blue'})`}
                  value={newAttributeValue[attribute.name] || ''}
                  onChange={(e) =>
                    setNewAttributeValue({
                      ...newAttributeValue,
                      [attribute.name]: e.target.value,
                    })
                  }
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAttributeValue(attrIndex);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addAttributeValue(attrIndex)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Attribute */}
        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <Input
            variant="dark"
            placeholder="Add attribute (e.g., Color, Material)"
            value={newAttributeName}
            onChange={(e) => setNewAttributeName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAttribute();
              }
            }}
          />
          <button
            type="button"
            onClick={addAttribute}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
          >
            <Plus size={18} className="inline mr-1" />
            Add Attribute
          </button>
        </div>

        {/* Generate Variants Button */}
        <button
          type="button"
          onClick={generateVariants}
          className="mt-4 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          Generate Variants ({attributes.reduce((acc, attr) => acc * (attr.values.length || 1), 1)} combinations)
        </button>
      </div>

      {/* Variant Table */}
      {variants.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200">
              Manage Variants ({variants.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 text-gray-300 text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Attributes</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Sale Price</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Active</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {variants.map((variant, index) => (
                  <tr key={index} className="hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <Input
                        variant="dark"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="w-32 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        variant="dark"
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(index, 'price', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        variant="dark"
                        type="number"
                        step="0.01"
                        value={variant.salePrice || ''}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            'salePrice',
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        className="w-24 text-sm"
                        placeholder="Optional"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        variant="dark"
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, 'stock', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-20 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(e) => updateVariant(index, 'isActive', e.target.checked)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

VariantManager.displayName = 'VariantManager';

export { VariantManager };
