'use client';

import React, { useEffect } from 'react';
import { Input } from '../core/Input';
import { Textarea } from '../core/Textarea';
import { Search, Tag } from 'lucide-react';

export interface SEOData {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
}

export interface SEOFieldsProps {
  value: SEOData;
  onChange: (value: SEOData) => void;
  productName: string;
  autoGenerateSlug?: boolean;
  className?: string;
}

/**
 * SEOFields Component
 * Input fields for SEO optimization (title, description, slug, keywords)
 *
 * @example
 * <SEOFields
 *   value={seoData}
 *   onChange={setSeoData}
 *   productName="Premium T-Shirt"
 *   autoGenerateSlug
 * />
 */
const SEOFields: React.FC<SEOFieldsProps> = ({
  value,
  onChange,
  productName,
  autoGenerateSlug = true,
  className = '',
}) => {
  // Auto-generate slug from product name
  useEffect(() => {
    if (autoGenerateSlug && productName && !value.slug) {
      const generatedSlug = productName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      onChange({ ...value, slug: generatedSlug });
    }
  }, [productName, autoGenerateSlug]);

  const updateField = (field: keyof SEOData, val: unknown) => {
    onChange({ ...value, [field]: val });
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !value.keywords.includes(keyword)) {
      onChange({ ...value, keywords: [...value.keywords, keyword] });
    }
  };

  const removeKeyword = (index: number) => {
    onChange({
      ...value,
      keywords: value.keywords.filter((_, i) => i !== index),
    });
  };

  const [keywordInput, setKeywordInput] = React.useState('');

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Search className="text-purple-400" size={20} />
        <h4 className="text-md font-semibold text-gray-200">
          SEO Optimization
        </h4>
      </div>

      {/* Meta Title */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Meta Title
          </label>
          <span
            className={`text-xs ${
              value.title.length > 60 ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {value.title.length}/60
          </span>
        </div>
        <Input
          variant="dark"
          value={value.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Premium Cotton T-Shirt | Your Store"
          maxLength={60}
        />
        <p className="mt-1 text-xs text-gray-400">
          Appears in search engine results. Keep it under 60 characters.
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Meta Description
          </label>
          <span
            className={`text-xs ${
              value.description.length > 160 ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {value.description.length}/160
          </span>
        </div>
        <Textarea
          variant="dark"
          value={value.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="High-quality cotton t-shirt, perfect for casual wear. Available in multiple sizes and colors."
          rows={3}
          maxLength={160}
        />
        <p className="mt-1 text-xs text-gray-400">
          Brief description for search results. Aim for 150-160 characters.
        </p>
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          URL Slug
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">yourstore.com/products/</span>
          <Input
            variant="dark"
            value={value.slug}
            onChange={(e) => {
              const slug = e.target.value
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
              updateField('slug', slug);
            }}
            placeholder="premium-cotton-t-shirt"
            className="flex-1"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          SEO-friendly URL. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {/* Keywords/Tags */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag size={16} className="text-gray-400" />
          <label className="block text-sm font-medium text-gray-300">
            Keywords ({value.keywords.length}/10)
          </label>
        </div>

        {/* Keyword Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.keywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="hover:text-purple-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Add Keyword Input */}
        {value.keywords.length < 10 && (
          <div className="flex gap-2">
            <Input
              variant="dark"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword(keywordInput);
                  setKeywordInput('');
                }
              }}
              placeholder="Add keyword (e.g., cotton, t-shirt, casual)"
            />
            <button
              type="button"
              onClick={() => {
                addKeyword(keywordInput);
                setKeywordInput('');
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        <p className="mt-2 text-xs text-gray-400">
          Keywords help customers find your product. Add up to 10 relevant keywords.
        </p>
      </div>
    </div>
  );
};

SEOFields.displayName = 'SEOFields';

export { SEOFields };
