'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Input } from '../../core/Input';
import { COLOR_PALETTE } from './constants';

export interface ColorPickerProps {
  selectedColors: string[];
  onColorSelect: (colorName: string) => void;
  customColorValue: string;
  onCustomColorChange: (value: string) => void;
  onCustomColorSubmit: () => void;
}

/**
 * ColorPicker Component
 * Visual color selection grid with custom color input option
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColors,
  onColorSelect,
  customColorValue,
  onCustomColorChange,
  onCustomColorSubmit,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const availableColors = COLOR_PALETTE.filter(
    (color) => !selectedColors.includes(color.name)
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Select from palette
      </p>

      {/* Color Palette Grid */}
      <div className="grid grid-cols-6 gap-2 p-3 bg-surface-container rounded-xl">
        {availableColors.map((color, colorIndex) => (
          <button
            key={colorIndex}
            type="button"
            onClick={() => onColorSelect(color.name)}
            className="group relative w-10 h-10 rounded-lg transition-all hover:ring-2 hover:ring-brand-primary hover:ring-offset-2 hover:ring-offset-surface-container cursor-pointer"
            style={{
              backgroundColor: color.hex,
              boxShadow:
                color.textColor === '#000000'
                  ? 'inset 0 0 0 1px rgba(0,0,0,0.12)'
                  : 'none',
            }}
            title={color.name}
          >
            {/* Color name tooltip on hover */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-container-lowest text-gray-900 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
              {color.name}
            </span>
          </button>
        ))}

        {availableColors.length === 0 && (
          <div className="col-span-6 py-3 text-center text-sm text-gray-500">
            All colors selected
          </div>
        )}
      </div>

      {/* Custom Color Input */}
      <div>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:opacity-75 transition-opacity py-1 cursor-pointer"
        >
          <Plus size={13} />
          Add custom color name
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${showCustom ? 'rotate-180' : ''}`}
          />
        </button>

        {showCustom && (
          <div className="flex gap-2 mt-2">
            <Input
              variant="dark"
              placeholder="e.g., Midnight Blue, Sunset Orange"
              value={customColorValue}
              onChange={(e) => onCustomColorChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCustomColorSubmit();
                }
              }}
            />
            <button
              type="button"
              onClick={onCustomColorSubmit}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ColorPicker.displayName = 'ColorPicker';
