'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Input } from '../../core/Input';
import { ColorPicker } from './ColorPicker';
import { isColorAttribute, getAttributePlaceholder } from './utils';

export interface AttributeInputProps {
  attributeName: string;
  selectedValues: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddValue: (directValue?: string) => void;
}

/**
 * AttributeInput Component
 * Conditional input that shows ColorPicker for color attributes
 * or regular text input for other attributes
 */
export const AttributeInput: React.FC<AttributeInputProps> = ({
  attributeName,
  selectedValues,
  inputValue,
  onInputChange,
  onAddValue,
}) => {
  if (isColorAttribute(attributeName)) {
    return (
      <ColorPicker
        selectedColors={selectedValues}
        onColorSelect={(colorName) => {
          // Pass color directly to avoid state timing issues
          onAddValue(colorName);
        }}
        customColorValue={inputValue}
        onCustomColorChange={onInputChange}
        onCustomColorSubmit={onAddValue}
      />
    );
  }

  // Regular text input for non-color attributes
  return (
    <div className="flex gap-2">
      <Input
        variant="dark"
        placeholder={`Add ${attributeName.toLowerCase()} option (e.g., ${getAttributePlaceholder(
          attributeName
        )})`}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAddValue();
          }
        }}
      />
      <button
        type="button"
        onClick={() => onAddValue()}
        className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};

AttributeInput.displayName = 'AttributeInput';
