'use client';

import React, { useEffect } from 'react';
import { Input } from '../core/Input';
import { Textarea } from '../core/Textarea';
import { Search, Tag, X, ExternalLink } from 'lucide-react';

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
  }, [productName, autoGenerateSlug, value, onChange]);

  const updateField = (field: keyof SEOData, val: unknown) => {
    onChange({ ...value, [field]: val });
  };

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed && !value.keywords.includes(trimmed) && value.keywords.length < 10) {
      onChange({ ...value, keywords: [...value.keywords, trimmed] });
    }
  };

  const removeKeyword = (index: number) => {
    onChange({
      ...value,
      keywords: value.keywords.filter((_, i) => i !== index),
    });
  };

  const [keywordInput, setKeywordInput] = React.useState('');

  const titlePct = Math.min((value.title.length / 60) * 100, 100);
  const descPct = Math.min((value.description.length / 160) * 100, 100);
  const titleOver = value.title.length > 60;
  const descOver = value.description.length > 160;

  const previewTitle = value.title || (productName ? `${productName} | Your Store` : 'Product Title');
  const previewDesc = value.description || 'Your product description will appear here in search engine results.';
  const previewSlug = value.slug || 'product-slug';

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Search size={16} className="text-brand-primary" />
          <h3 className="text-base font-semibold text-gray-900">
            SEO Optimization
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          Help customers find your product on search engines
        </p>
      </div>

      {/* Google Search Preview */}
      <div className="p-4 bg-surface-container rounded-xl space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Search Preview
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <ExternalLink size={11} />
          <span>yourstore.com/products/{previewSlug}</span>
        </div>
        <p className="text-sm font-medium text-brand-primary leading-snug line-clamp-1">
          {previewTitle}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {previewDesc}
        </p>
      </div>

      {/* Meta Title */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            Meta Title
          </label>
          <span
            className={`text-xs font-medium ${
              titleOver ? 'text-feedback-error' : 'text-gray-500'
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
          maxLength={70}
        />
        {/* Progress bar */}
        <div className="mt-1.5 h-1 bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              titleOver ? 'bg-feedback-error' : titlePct > 80 ? 'bg-feedback-warning' : 'bg-feedback-success'
            }`}
            style={{ width: `${titlePct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Appears in search engine results. Keep it under 60 characters.
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            Meta Description
          </label>
          <span
            className={`text-xs font-medium ${
              descOver ? 'text-feedback-error' : 'text-gray-500'
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
          maxLength={180}
        />
        {/* Progress bar */}
        <div className="mt-1.5 h-1 bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              descOver ? 'bg-feedback-error' : descPct > 85 ? 'bg-feedback-warning' : 'bg-feedback-success'
            }`}
            style={{ width: `${descPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Brief description for search results. Aim for 150–160 characters.
        </p>
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          URL Slug
        </label>
        <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-surface-container-highest">
          <span className="px-3 py-2.5 bg-surface-container text-gray-500 text-sm whitespace-nowrap flex-shrink-0 border-r border-surface-container-highest">
            yourstore.com/products/
          </span>
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
            className="flex-1 border-0 rounded-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          SEO-friendly URL. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {/* Keywords */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-brand-primary" />
            <label className="block text-sm font-semibold text-gray-900">
              Keywords
            </label>
          </div>
          <span className="text-xs text-gray-500">
            {value.keywords.length}/10
          </span>
        </div>

        {/* Keyword Chips */}
        {value.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {value.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="ml-0.5 flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                  aria-label={`Remove ${keyword}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Keyword */}
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
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap text-sm font-medium cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        {value.keywords.length >= 10 && (
          <p className="text-xs text-feedback-warning">
            Maximum of 10 keywords reached.
          </p>
        )}

        <p className="mt-2 text-xs text-gray-500">
          Keywords help customers find your product. Add up to 10 relevant keywords.
        </p>
      </div>
    </div>
  );
};

SEOFields.displayName = 'SEOFields';

export { SEOFields };
