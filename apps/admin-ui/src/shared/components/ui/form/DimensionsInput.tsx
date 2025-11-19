/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React from 'react';
import { Input } from 'libs/shared/components/input/src/lib/input';
import { Select } from '../core/Select';
import { Package } from 'lucide-react';

export interface ShippingDimensions {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  freeShipping: boolean;
  shippingClass: 'standard' | 'express' | 'fragile' | 'heavy';
}

export interface DimensionsInputProps {
  value: ShippingDimensions;
  onChange: (value: ShippingDimensions) => void;
  className?: string;
}

const SHIPPING_CLASSES = [
  { value: 'standard', label: 'Standard Shipping' },
  { value: 'express', label: 'Express Shipping' },
  { value: 'fragile', label: 'Fragile Items' },
  { value: 'heavy', label: 'Heavy Items' },
];

/**
 * DimensionsInput Component
 * Input for product shipping dimensions and weight
 *
 * @example
 * <DimensionsInput
 *   value={shippingInfo}
 *   onChange={setShippingInfo}
 * />
 */
const DimensionsInput: React.FC<DimensionsInputProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const updateField = (field: keyof ShippingDimensions, val: unknown) => {
    onChange({ ...value, [field]: val });
  };

  const updateDimension = (dim: 'length' | 'width' | 'height', val: number) => {
    onChange({
      ...value,
      dimensions: { ...value.dimensions, [dim]: val },
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Package className="text-blue-400" size={20} />
        <h4 className="text-md font-semibold text-gray-200">
          Shipping Information
        </h4>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Weight (kg) *
        </label>
        <Input
          variant="dark"
          type="number"
          step="0.1"
          min="0"
          value={value.weight}
          onChange={(e) =>
            updateField('weight', parseFloat(e.target.value) || 0)
          }
          placeholder="0.5"
        />
        <p className="mt-1 text-xs text-gray-400">
          Product weight for shipping calculation
        </p>
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Dimensions (cm) *
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Input
              variant="dark"
              type="number"
              step="0.1"
              min="0"
              value={value.dimensions.length}
              onChange={(e) =>
                updateDimension('length', parseFloat(e.target.value) || 0)
              }
              placeholder="Length"
            />
            <span className="text-xs text-gray-400 mt-1 block">Length</span>
          </div>
          <div>
            <Input
              variant="dark"
              type="number"
              step="0.1"
              min="0"
              value={value.dimensions.width}
              onChange={(e) =>
                updateDimension('width', parseFloat(e.target.value) || 0)
              }
              placeholder="Width"
            />
            <span className="text-xs text-gray-400 mt-1 block">Width</span>
          </div>
          <div>
            <Input
              variant="dark"
              type="number"
              step="0.1"
              min="0"
              value={value.dimensions.height}
              onChange={(e) =>
                updateDimension('height', parseFloat(e.target.value) || 0)
              }
              placeholder="Height"
            />
            <span className="text-xs text-gray-400 mt-1 block">Height</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Package dimensions for shipping cost calculation
        </p>
      </div>

      {/* Shipping Class */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Shipping Class
        </label>
        <Select
          variant="dark"
          value={value.shippingClass}
          onChange={(val) =>
            updateField(
              'shippingClass',
              val as ShippingDimensions['shippingClass']
            )
          }
          options={SHIPPING_CLASSES}
        />
      </div>

      {/* Free Shipping */}
      <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
        <input
          type="checkbox"
          id="freeShipping"
          checked={value.freeShipping}
          onChange={(e) => updateField('freeShipping', e.target.checked)}
          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
        />
        <label
          htmlFor="freeShipping"
          className="text-sm font-medium text-gray-300 cursor-pointer"
        >
          Offer free shipping for this product
        </label>
      </div>
    </div>
  );
};

DimensionsInput.displayName = 'DimensionsInput';

export { DimensionsInput };
