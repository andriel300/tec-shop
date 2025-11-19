/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { Input } from 'libs/shared/components/input/src/lib/input';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
}

/**
 * TagInput Component
 * Input for adding/removing product tags (e.g., "sale", "bestseller", "new-arrival")
 *
 * @example
 * <TagInput
 *   value={tags}
 *   onChange={setTags}
 *   maxTags={20}
 *   placeholder="Add tags like 'summer', 'sale', 'trending'"
 * />
 */
const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  maxTags = 20,
  placeholder = 'Add tag (e.g., sale, bestseller, new)',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();

    // Validation
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) {
      return; // Duplicate
    }
    if (value.length >= maxTags) {
      return; // Max limit reached
    }
    if (trimmedTag.length < 2) {
      return; // Too short
    }
    if (trimmedTag.length > 30) {
      return; // Too long
    }

    onChange([...value, trimmedTag]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Tag size={16} className="text-blue-400" />
        <label className="block text-sm font-medium text-gray-300">
          Product Tags ({value.length}/{maxTags})
        </label>
      </div>

      {/* Tag Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-300 rounded-full text-sm border border-blue-500/30 hover:border-blue-500/50 transition-colors"
            >
              <Tag size={12} />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:text-blue-100 transition-colors ml-1"
                title="Remove tag"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      {value.length < maxTags && (
        <div className="flex gap-2">
          <Input
            variant="dark"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
            maxLength={30}
          />
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            disabled={!inputValue.trim() || value.length >= maxTags}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Tags help customers find your product (e.g., &quot;sale&quot;,
        &quot;trending&quot;, &quot;new-arrival&quot;). Press Enter or click
        Add.
      </p>

      {value.length >= maxTags && (
        <p className="mt-2 text-xs text-yellow-500">
          Maximum {maxTags} tags reached. Remove a tag to add more.
        </p>
      )}
    </div>
  );
};

TagInput.displayName = 'TagInput';

export { TagInput };
