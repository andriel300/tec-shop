/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from 'libs/shared/components/input/src/lib/input';
import { COLOR_PALETTE } from './constants';
import { isColorAttribute } from './utils';

export interface ProductVariant {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  stock: number;
  isActive: boolean;
}

export interface VariantTableProps {
  variants: ProductVariant[];
  onUpdateVariant: (
    index: number,
    field: keyof ProductVariant,
    value: unknown
  ) => void;
  onRemoveVariant: (index: number) => void;
}

/**
 * VariantTable Component
 * Displays and allows editing of generated product variants
 */
export const VariantTable: React.FC<VariantTableProps> = ({
  variants,
  onUpdateVariant,
  onRemoveVariant,
}) => {
  if (variants.length === 0) {
    return null;
  }

  return (
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
                    onChange={(e) =>
                      onUpdateVariant(index, 'sku', e.target.value)
                    }
                    className="w-32 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(variant.attributes).map(([key, value]) => {
                      const colorData = isColorAttribute(key)
                        ? COLOR_PALETTE.find((c) => c.name === value)
                        : null;

                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                        >
                          {colorData && (
                            <span
                              className="w-3 h-3 rounded-full border border-gray-500"
                              style={{ backgroundColor: colorData.hex }}
                            />
                          )}
                          <span className="font-medium text-gray-400">
                            {key}:
                          </span>{' '}
                          {value}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Input
                    variant="dark"
                    type="number"
                    step="0.01"
                    value={variant.price}
                    onChange={(e) =>
                      onUpdateVariant(
                        index,
                        'price',
                        parseFloat(e.target.value) || 0
                      )
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
                      onUpdateVariant(
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
                      onUpdateVariant(
                        index,
                        'stock',
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-20 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={variant.isActive}
                    onChange={(e) =>
                      onUpdateVariant(index, 'isActive', e.target.checked)
                    }
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onRemoveVariant(index)}
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
  );
};

VariantTable.displayName = 'VariantTable';
