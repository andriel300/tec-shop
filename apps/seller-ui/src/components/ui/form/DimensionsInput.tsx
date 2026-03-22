'use client';

import React from 'react';
import { Input } from '../core/Input';
import {
  Package,
  Truck,
  Zap,
  Shield,
  Weight,
  Ruler,
  ArrowLeftRight,
  ArrowUpDown,
} from 'lucide-react';

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

const SHIPPING_CLASSES: {
  value: ShippingDimensions['shippingClass'];
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    value: 'standard',
    label: 'Standard',
    description: '3–7 business days',
    icon: Truck,
  },
  {
    value: 'express',
    label: 'Express',
    description: '1–2 business days',
    icon: Zap,
  },
  {
    value: 'fragile',
    label: 'Fragile',
    description: 'Handle with care',
    icon: Shield,
  },
  {
    value: 'heavy',
    label: 'Heavy',
    description: 'Over 20 kg',
    icon: Weight,
  },
];

/**
 * DimensionsInput Component
 * Input for product shipping dimensions, weight, and shipping class
 */
const DimensionsInput: React.FC<DimensionsInputProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const updateField = (field: keyof ShippingDimensions, val: unknown) => {
    onChange({ ...value, [field]: val });
  };

  const updateDimension = (
    dim: 'length' | 'width' | 'height',
    val: number
  ) => {
    onChange({
      ...value,
      dimensions: { ...value.dimensions, [dim]: val },
    });
  };

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Package size={16} className="text-brand-primary" />
          <h3 className="text-base font-semibold text-gray-900">
            Shipping Information
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          Set weight, dimensions, and shipping preferences for this product
        </p>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Weight (kg) <span className="text-feedback-error">*</span>
        </label>
        <div className="relative">
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
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Product weight used for shipping cost calculation
        </p>
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Dimensions (cm) <span className="text-feedback-error">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <Ruler size={14} />
              </span>
              <Input
                variant="dark"
                type="number"
                step="0.1"
                min="0"
                value={value.dimensions.length}
                onChange={(e) =>
                  updateDimension('length', parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="pl-8"
              />
            </div>
            <span className="text-xs text-gray-500 mt-1.5 block">Length</span>
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <ArrowLeftRight size={14} />
              </span>
              <Input
                variant="dark"
                type="number"
                step="0.1"
                min="0"
                value={value.dimensions.width}
                onChange={(e) =>
                  updateDimension('width', parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="pl-8"
              />
            </div>
            <span className="text-xs text-gray-500 mt-1.5 block">Width</span>
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <ArrowUpDown size={14} />
              </span>
              <Input
                variant="dark"
                type="number"
                step="0.1"
                min="0"
                value={value.dimensions.height}
                onChange={(e) =>
                  updateDimension('height', parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="pl-8"
              />
            </div>
            <span className="text-xs text-gray-500 mt-1.5 block">Height</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Package dimensions for accurate shipping cost calculation
        </p>
      </div>

      {/* Shipping Class */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Shipping Class
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SHIPPING_CLASSES.map((cls) => {
            const IconComp = cls.icon;
            const isSelected = value.shippingClass === cls.value;
            return (
              <button
                key={cls.value}
                type="button"
                onClick={() => updateField('shippingClass', cls.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-surface-container-highest bg-surface-container hover:bg-surface-container-highest'
                }`}
              >
                <span
                  className={`flex-shrink-0 ${isSelected ? 'text-brand-primary' : 'text-gray-500'}`}
                >
                  <IconComp size={18} />
                </span>
                <span>
                  <span
                    className={`block text-sm font-semibold ${isSelected ? 'text-brand-primary' : 'text-gray-900'}`}
                  >
                    {cls.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {cls.description}
                  </span>
                </span>
                {isSelected && (
                  <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-brand-primary flex items-center justify-center">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#ffffff' }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Free Shipping Toggle */}
      <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Free Shipping
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Offer free shipping to customers for this product
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.freeShipping}
          onClick={() => updateField('freeShipping', !value.freeShipping)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 ${
            value.freeShipping ? 'bg-brand-primary' : 'bg-surface-container-highest'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out mt-0.5 ${
              value.freeShipping ? 'translate-x-5' : 'translate-x-0.5'
            }`}
            style={{ backgroundColor: '#ffffff' }}
          />
        </button>
      </div>
    </div>
  );
};

DimensionsInput.displayName = 'DimensionsInput';

export { DimensionsInput };
