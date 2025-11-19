/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Input } from 'libs/shared/components/input/src/lib/input';
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
  const availableColors = COLOR_PALETTE.filter(
    (color) => !selectedColors.includes(color.name)
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        🎨 Select colors from the palette below:
      </p>

      {/* Color Palette Grid */}
      <div className="grid grid-cols-6 gap-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
        {availableColors.map((color, colorIndex) => (
          <button
            key={colorIndex}
            type="button"
            onClick={() => onColorSelect(color.name)}
            className="group relative w-12 h-12 rounded-lg border-2 border-gray-600 transition-all hover:scale-110 hover:border-blue-400 hover:shadow-lg hover:z-10"
            style={{ backgroundColor: color.hex }}
            title={color.name}
          >
            {/* Color name tooltip on hover */}
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 border border-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
              {color.name}
            </span>
          </button>
        ))}
      </div>

      {/* Custom Color Input */}
      <details className="text-sm group/custom">
        <summary className="list-none text-gray-500 cursor-pointer hover:text-blue-400 transition-colors select-none py-2 px-3 rounded hover:bg-gray-800/50 inline-block">
          <span className="inline-flex items-center gap-1">
            <Plus size={14} className="inline" />
            Add custom color name
          </span>
        </summary>
        <div className="flex gap-2 mt-3 pl-3">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
          </button>
        </div>
      </details>
    </div>
  );
};

ColorPicker.displayName = 'ColorPicker';
