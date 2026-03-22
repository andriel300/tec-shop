'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '../../core/Input';
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

  const activeCount = variants.filter((v) => v.isActive).length;

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Manage Variants
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} &middot;{' '}
            {activeCount} active
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-container">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                SKU
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Attributes
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Price
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Sale Price
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Stock
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Active
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {variants.map((variant, index) => (
              <tr
                key={index}
                className={`hover:bg-surface-container transition-colors ${
                  !variant.isActive ? 'opacity-50' : ''
                }`}
              >
                {/* SKU */}
                <td className="px-4 py-3">
                  <Input
                    variant="dark"
                    value={variant.sku}
                    onChange={(e) =>
                      onUpdateVariant(index, 'sku', e.target.value)
                    }
                    className="w-32 text-xs"
                  />
                </td>

                {/* Attributes */}
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(variant.attributes).map(([key, value]) => {
                      const colorData = isColorAttribute(key)
                        ? COLOR_PALETTE.find((c) => c.name === value)
                        : null;

                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-surface-container text-gray-900 rounded-md text-xs"
                        >
                          {colorData && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: colorData.hex,
                                boxShadow:
                                  colorData.textColor === '#000000'
                                    ? 'inset 0 0 0 1px rgba(0,0,0,0.12)'
                                    : 'none',
                              }}
                            />
                          )}
                          <span className="text-gray-500">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </span>
                      );
                    })}
                  </div>
                </td>

                {/* Price */}
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
                    className="w-24 text-xs"
                  />
                </td>

                {/* Sale Price */}
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
                    className="w-24 text-xs"
                    placeholder="Optional"
                  />
                </td>

                {/* Stock */}
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
                    className="w-20 text-xs"
                  />
                </td>

                {/* Active Toggle */}
                <td className="px-4 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={variant.isActive}
                    onClick={() =>
                      onUpdateVariant(index, 'isActive', !variant.isActive)
                    }
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 ${
                      variant.isActive
                        ? 'bg-brand-primary'
                        : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out mt-0.5 ${
                        variant.isActive ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                      style={{ backgroundColor: '#ffffff' }}
                    />
                  </button>
                </td>

                {/* Delete */}
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onRemoveVariant(index)}
                    className="p-1.5 rounded-md text-feedback-error hover:bg-feedback-error/10 transition-colors cursor-pointer"
                    title="Remove variant"
                  >
                    <Trash2 size={14} />
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
