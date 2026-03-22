'use client';

import React from 'react';
import { DollarSign, Shield, Youtube } from 'lucide-react';
import { Input } from '../../../../../../components/ui/core/Input';
import { Select } from '../../../../../../components/ui/core/Select';
import { FormField } from '../../../../../../components/ui/form/FormField';
import { RichTextEditor } from '../../../../../../components/ui/form/RichTextEditor';
import {
  CategorySelector,
  type Category,
} from '../../../../../../components/ui/form/CategorySelector';
import {
  BrandSelector,
  type Brand,
} from '../../../../../../components/ui/form/BrandSelector';
import { TagInput } from '../../../../../../components/ui/form/TagInput';
import { DiscountSelector } from '../../../../../../components/ui/form/DiscountSelector';

const PRODUCT_TYPES = [
  { value: 'simple', label: 'Simple Product' },
  { value: 'variable', label: 'Variable Product (with variants)' },
  { value: 'digital', label: 'Digital Product' },
];

interface BasicInfoTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  setSelectedCategory: (category: Category | null) => void;
  setSelectedBrand: (brand: Brand | null) => void;
  setDynamicAttributes: (attrs: Record<string, unknown>) => void;
}

export function BasicInfoTab({
  form,
  setSelectedCategory,
  setSelectedBrand,
  setDynamicAttributes,
}: BasicInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Product Name */}
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }: { value: string }) =>
            !value
              ? 'Product name is required'
              : value.length < 3
              ? 'Product name must be at least 3 characters'
              : undefined,
        }}
      >
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <FormField field={field} label="Product Name" required>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.value)
              }
              placeholder="e.g., Premium Cotton T-Shirt"
              variant="dark"
            />
          </FormField>
        )}
      </form.Field>

      {/* Product Description */}
      <form.Field
        name="description"
        validators={{
          onChange: ({ value }: { value: string }) => {
            const wordCount = value.split(/\s+/).filter(Boolean).length;
            return wordCount < 50
              ? 'Description must be at least 50 words (150-200 recommended)'
              : wordCount > 200
              ? 'Description should not exceed 200 words'
              : undefined;
          },
        }}
      >
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <FormField field={field} label="Product Description" required>
            <RichTextEditor
              value={field.state.value}
              onChange={(value: string) => field.handleChange(value)}
              onBlur={field.handleBlur}
              placeholder="Describe your product in detail..."
              minWords={50}
              maxWords={200}
            />
          </FormField>
        )}
      </form.Field>

      {/* Category */}
      <form.Field
        name="categoryId"
        validators={{
          onChange: ({ value }: { value: string }) =>
            !value ? 'Category is required' : undefined,
        }}
      >
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <FormField field={field} label="Category" required>
            <CategorySelector
              value={field.state.value}
              onChange={(categoryId: string, category?: Category) => {
                field.handleChange(categoryId);
                setSelectedCategory(category || null);
              }}
              onAttributesChange={setDynamicAttributes}
            />
          </FormField>
        )}
      </form.Field>

      {/* Brand */}
      <form.Field name="brandId">
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <BrandSelector
            value={field.state.value}
            onChange={(brandId: string, brand?: Brand) => {
              field.handleChange(brandId);
              setSelectedBrand(brand || null);
            }}
          />
        )}
      </form.Field>

      {/* Product Type */}
      <form.Field name="productType">
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <FormField field={field} label="Product Type" required>
            <Select
              value={field.state.value}
              onChange={(value: string) => {
                field.handleChange(value as 'simple' | 'variable' | 'digital');
                form.setFieldValue('hasVariants', value === 'variable');
              }}
              options={PRODUCT_TYPES}
              variant="dark"
            />
          </FormField>
        )}
      </form.Field>

      {/* Pricing */}
      <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign size={16} className="text-feedback-success" />
            Pricing
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Set your product price and optional sale price
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Regular Price */}
          <form.Field
            name="price"
            validators={{
              onChange: ({ value }: { value: number }) =>
                value <= 0 ? 'Price must be greater than 0' : undefined,
            }}
          >
            {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <FormField field={field} label="Regular Price ($)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.state.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  variant="dark"
                />
              </FormField>
            )}
          </form.Field>

          {/* Sale Price */}
          <form.Field name="salePrice">
            {(field: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const regularPrice = form.getFieldValue('price') || 0;
              const salePrice = field.state.value || 0;
              const discount =
                regularPrice > 0 && salePrice > 0 && salePrice < regularPrice
                  ? Math.round(
                      ((regularPrice - salePrice) / regularPrice) * 100
                    )
                  : 0;

              return (
                <FormField field={field} label="Sale Price ($)">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.state.value || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.handleChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      placeholder="Leave empty for regular price"
                      variant="dark"
                    />
                    {discount > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-feedback-success/10 text-feedback-success rounded-md font-semibold text-xs">
                          {discount}% OFF
                        </span>
                        <span className="text-gray-500 text-xs">
                          Save ${(regularPrice - salePrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Products with a sale price will appear in the{' '}
                      <span className="font-semibold text-feedback-error">
                        Special Offers
                      </span>{' '}
                      section on the customer store
                    </p>
                  </div>
                </FormField>
              );
            }}
          </form.Field>
        </div>

        {/* Stock */}
        <form.Field
          name="stock"
          validators={{
            onChange: ({ value }: { value: number }) =>
              value < 0 ? 'Stock cannot be negative' : undefined,
          }}
        >
          {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <FormField field={field} label="Stock Quantity" required>
              <Input
                type="number"
                min="0"
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(parseInt(e.target.value, 10) || 0)
                }
                placeholder="0"
                variant="dark"
              />
            </FormField>
          )}
        </form.Field>
      </div>

      {/* Discount Code */}
      <form.Field name="discountCodeId">
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <DiscountSelector
            value={field.state.value}
            onChange={(discountId: string | undefined) =>
              field.handleChange(discountId)
            }
          />
        )}
      </form.Field>

      {/* Product Tags */}
      <form.Field name="tags">
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <TagInput
              value={field.state.value}
              onChange={(tags: string[]) => field.handleChange(tags)}
              maxTags={20}
              placeholder="Add tag (e.g., summer, sale, trending)"
            />
          </div>
        )}
      </form.Field>

      {/* Additional Details */}
      <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Shield size={16} className="text-brand-primary" />
            Additional Details
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Optional information to enrich your product listing
          </p>
        </div>

        {/* Warranty */}
        <form.Field name="warranty">
          {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <FormField field={field} label="Warranty">
              <Input
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value)
                }
                placeholder="e.g., 1 year manufacturer warranty"
                variant="dark"
              />
            </FormField>
          )}
        </form.Field>

        {/* YouTube URL */}
        <form.Field
          name="youtubeUrl"
          validators={{
            onBlur: ({ value }: { value: string }) =>
              value &&
              !/^https?:\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]+$/.test(
                value
              )
                ? 'Please enter a valid YouTube embed URL.'
                : undefined,
          }}
        >
          {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <FormField field={field} label="YouTube URL (Optional)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <Youtube size={15} />
                </span>
                <Input
                  value={field.state.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
                  placeholder="e.g., https://www.youtube.com/embed/xyz123"
                  variant="dark"
                  className="pl-9"
                />
              </div>
            </FormField>
          )}
        </form.Field>
      </div>
    </div>
  );
}
