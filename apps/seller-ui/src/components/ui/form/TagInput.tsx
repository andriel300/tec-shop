'use client';

import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { Input } from '../core/Input';

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
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (value.length >= maxTags) return;
    if (trimmedTag.length < 2) return;
    if (trimmedTag.length > 30) return;

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
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-brand-primary" />
          <label className="block text-sm font-semibold text-gray-900">
            Product Tags
          </label>
        </div>
        <span className="text-xs text-gray-500">
          {value.length}/{maxTags}
        </span>
      </div>

      {/* Tag Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium"
            >
              <Tag size={10} />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-0.5 flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                aria-label={`Remove ${tag}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
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
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium cursor-pointer"
          >
            Add
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Tags help customers find your product (e.g., &quot;sale&quot;, &quot;trending&quot;,
        &quot;new-arrival&quot;). Press Enter or click Add.
      </p>

      {value.length >= maxTags && (
        <p className="mt-1.5 text-xs text-feedback-warning">
          Maximum {maxTags} tags reached. Remove a tag to add more.
        </p>
      )}
    </div>
  );
};

TagInput.displayName = 'TagInput';

export { TagInput };
