'use client';

import { useForm } from '@tanstack/react-form';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Package, DollarSign, Tag, Boxes } from 'lucide-react';
import { useProduct, useUpdateProduct } from '../../../../../../hooks/useProducts';
import { Alert } from '../../../../../../components/ui/core/Alert';
import { Input } from '../../../../../../components/ui/core/Input';
import { Select } from '../../../../../../components/ui/core/Select';
import { FormField } from '../../../../../../components/ui/form/FormField';
import { ProductImageUploader } from '../../../../../../components/ui/form/ProductImageUploader';
import { RichTextEditor } from '../../../../../../components/ui/form/RichTextEditor';
import { VariantManager, type ProductVariant } from '../../../../../../components/ui/form/VariantManager';
import { DimensionsInput } from '../../../../../../components/ui/form/DimensionsInput';
import { SEOFields } from '../../../../../../components/ui/form/SEOFields';
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
import { Breadcrumb } from '../../../../../../components/navigation/Breadcrumb';

const PRODUCT_TYPES = [
  { value: 'simple', label: 'Simple Product' },
  { value: 'variable', label: 'Variable Product (with variants)' },
  { value: 'digital', label: 'Digital Product' },
];

const PRODUCT_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
];

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  // Fetch product data
  const { data: product, isLoading, error: fetchError } = useProduct(productId);
  const { mutate: updateProductMutation, isPending: isUpdating } = useUpdateProduct(productId);

  const [productImages, setProductImages] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [, setSelectedCategory] = useState<Category | null>(null);
  const [, setSelectedBrand] = useState<Brand | null>(null);
  const [dynamicAttributes, setDynamicAttributes] = useState<
    Record<string, unknown>
  >({});
  const [activeTab, setActiveTab] = useState<
    'basic' | 'variants' | 'shipping' | 'seo'
  >('basic');

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      brandId: '',
      productType: 'simple' as 'simple' | 'variable' | 'digital',
      price: 0,
      salePrice: undefined as number | undefined,
      stock: 0,
      images: [] as File[],
      hasVariants: false,
      variants: [] as ProductVariant[],
      attributes: {} as Record<string, unknown>,
      shipping: {
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        freeShipping: false,
        shippingClass: 'standard' as 'standard' | 'express' | 'fragile' | 'heavy',
      },
      seo: {
        title: '',
        description: '',
        slug: '',
        keywords: [] as string[],
      },
      warranty: '',
      youtubeUrl: '',
      tags: [] as string[],
      discountCodeId: undefined as string | undefined,
      status: 'draft' as 'draft' | 'published' | 'scheduled',
      isFeatured: false,
    },
    onSubmit: async ({ value }) => {
      try {
        setSubmitError(null);
        setSubmitSuccess(false);

        // Collect all image URLs (existing + newly uploaded via eager upload)
        // Since we use eager upload, all images are already ImageKit URLs
        const allImageUrls = uploadedImageUrls.filter(Boolean);

        // Product data for update
        const productData = {
          ...value,
          imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
          newImages: undefined, // No files since we use eager upload
          attributes: { ...dynamicAttributes, ...value.attributes },
        };

        // Remove 'images' field from productData as we're using imageUrls
        delete (productData as Record<string, unknown>).images;

        updateProductMutation(productData, {
          onSuccess: () => {
            setSubmitSuccess(true);
            setTimeout(() => {
              router.push('/dashboard/all-products');
            }, 1500);
          },
          onError: (error: Error) => {
            setSubmitError(error.message);
          },
        });
      } catch (error) {
        console.error('Failed to update product:', error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Failed to update product. Please try again.'
        );
      }
    },
  });

  // Initialize form with product data when loaded
  useEffect(() => {
    if (product) {
      // Convert API types to form types (UPPERCASE → lowercase)
      form.setFieldValue('name', product.name);
      form.setFieldValue('description', product.description);
      form.setFieldValue('categoryId', product.categoryId);
      form.setFieldValue('brandId', product.brandId || '');
      form.setFieldValue('productType', product.productType.toLowerCase() as 'simple' | 'variable' | 'digital');
      form.setFieldValue('price', product.price);
      form.setFieldValue('salePrice', product.salePrice || undefined);
      form.setFieldValue('stock', product.stock);
      form.setFieldValue('hasVariants', product.hasVariants);
      form.setFieldValue('variants', (product.variants as ProductVariant[]) || []);
      form.setFieldValue('attributes', product.attributes || {});
      form.setFieldValue('shipping', product.shipping ? product.shipping as {
        weight: number;
        dimensions: { length: number; width: number; height: number };
        freeShipping: boolean;
        shippingClass: 'standard' | 'express' | 'fragile' | 'heavy';
      } : {
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        freeShipping: false,
        shippingClass: 'standard' as const,
      });
      form.setFieldValue('seo', product.seo ? product.seo as {
        title: string;
        description: string;
        slug: string;
        keywords: string[];
      } : {
        title: '',
        description: '',
        slug: '',
        keywords: [],
      });
      form.setFieldValue('warranty', product.warranty || '');
      form.setFieldValue('youtubeUrl', product.youtubeUrl || '');
      form.setFieldValue('tags', product.tags || []);
      form.setFieldValue('discountCodeId', undefined); // Discount codes handled separately
      form.setFieldValue('status', product.status.toLowerCase() as 'draft' | 'published' | 'scheduled');
      form.setFieldValue('isFeatured', product.isFeatured);

      // Set dynamic attributes
      setDynamicAttributes(product.attributes || {});

      // Initialize image URLs
      setUploadedImageUrls(product.images || []);
    }
  }, [product]);

  // Handle image uploads from ImagePlaceHolder
  const handleImageUploaded = (url: string, index: number) => {
    setUploadedImageUrls((prev) => {
      const updated = [...prev];
      updated[index] = url;
      return updated.filter(Boolean); // Remove empty slots
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full mx-auto p-8 text-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError || !product) {
    return (
      <div className="w-full mx-auto p-8 text-white">
        <Alert
          variant="error"
          title="Product Not Found"
          description="The product you are trying to edit could not be found."
        />
        <button
          onClick={() => router.push('/dashboard/all-products')}
          className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-8 text-white">
      <h2 className="text-2xl py-2 font-semibold font-heading text-white">
        Edit Product
      </h2>

      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Products', href: '/dashboard/all-products' },
          { label: 'Edit Product' },
        ]}
      />

      {submitSuccess && (
        <Alert
          variant="success"
          title="Product Updated Successfully!"
          description="Redirecting to products list..."
        />
      )}

      {submitError && (
        <Alert
          variant="error"
          title="Error Updating Product"
          description={submitError}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Images & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <ProductImageUploader
              images={productImages}
              onChange={setProductImages}
              onImageUploaded={handleImageUploaded}
              initialUrls={product.images}
            />

            {/* Product Status */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <Tag size={20} className="text-green-400" />
                Product Status
              </h3>

              <form.Field name="status">
                {(field) => (
                  <FormField field={field} label="Status">
                    <Select
                      value={field.state.value}
                      onChange={(value) =>
                        field.handleChange(
                          value as 'draft' | 'published' | 'scheduled'
                        )
                      }
                      options={PRODUCT_STATUS}
                      variant="dark"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="isFeatured">
                {(field) => (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600"
                    />
                    <label
                      htmlFor="isFeatured"
                      className="text-sm text-gray-300"
                    >
                      Mark as featured product
                    </label>
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-700">
              {[
                { id: 'basic', label: 'Basic Info', icon: Package },
                { id: 'variants', label: 'Variants', icon: Boxes },
                { id: 'shipping', label: 'Shipping', icon: Package },
                { id: 'seo', label: 'SEO', icon: Tag },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Product Name */}
                  <form.Field
                    name="name"
                    validators={{
                      onChange: ({ value }) =>
                        !value
                          ? 'Product name is required'
                          : value.length < 3
                          ? 'Product name must be at least 3 characters'
                          : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field} label="Product Name" required>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
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
                      onChange: ({ value }) => {
                        const wordCount = value
                          .split(/\s+/)
                          .filter(Boolean).length;
                        return wordCount < 50
                          ? 'Description must be at least 50 words (150-200 recommended)'
                          : wordCount > 200
                          ? 'Description should not exceed 200 words'
                          : undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <FormField
                        field={field}
                        label="Product Description"
                        required
                      >
                        <RichTextEditor
                          value={field.state.value}
                          onChange={(value) => field.handleChange(value)}
                          onBlur={field.handleBlur}
                          placeholder="Describe your product in detail..."
                          minWords={50}
                          maxWords={200}
                        />
                      </FormField>
                    )}
                  </form.Field>

                  {/* Category Selector */}
                  <form.Field
                    name="categoryId"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? 'Category is required' : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field} label="Category" required>
                        <CategorySelector
                          value={field.state.value}
                          onChange={(categoryId, category) => {
                            field.handleChange(categoryId);
                            setSelectedCategory(category || null);
                          }}
                          onAttributesChange={setDynamicAttributes}
                        />
                      </FormField>
                    )}
                  </form.Field>

                  {/* Brand Selector */}
                  <form.Field name="brandId">
                    {(field) => (
                      <BrandSelector
                        value={field.state.value}
                        onChange={(brandId, brand) => {
                          field.handleChange(brandId);
                          setSelectedBrand(brand || null);
                        }}
                      />
                    )}
                  </form.Field>

                  {/* Product Type */}
                  <form.Field name="productType">
                    {(field) => (
                      <FormField field={field} label="Product Type" required>
                        <Select
                          value={field.state.value}
                          onChange={(value) => {
                            field.handleChange(
                              value as 'simple' | 'variable' | 'digital'
                            );
                            form.setFieldValue(
                              'hasVariants',
                              value === 'variable'
                            );
                          }}
                          options={PRODUCT_TYPES}
                          variant="dark"
                        />
                      </FormField>
                    )}
                  </form.Field>

                  {/* Pricing */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                      <DollarSign size={20} className="text-green-400" />
                      Pricing
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <form.Field
                        name="price"
                        validators={{
                          onChange: ({ value }) =>
                            value <= 0
                              ? 'Price must be greater than 0'
                              : undefined,
                        }}
                      >
                        {(field) => (
                          <FormField
                            field={field}
                            label="Regular Price ($)"
                            required
                          >
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0.00"
                              variant="dark"
                            />
                          </FormField>
                        )}
                      </form.Field>

                      <form.Field name="salePrice">
                        {(field) => (
                          <FormField field={field} label="Sale Price ($)">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={field.state.value || ''}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                              placeholder="Optional"
                              variant="dark"
                            />
                          </FormField>
                        )}
                      </form.Field>
                    </div>

                    <form.Field
                      name="stock"
                      validators={{
                        onChange: ({ value }) =>
                          value < 0 ? 'Stock cannot be negative' : undefined,
                      }}
                    >
                      {(field) => (
                        <FormField
                          field={field}
                          label="Stock Quantity"
                          required
                        >
                          <Input
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            placeholder="0"
                            variant="dark"
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>

                  {/* Discount Code Selector */}
                  <form.Field name="discountCodeId">
                    {(field) => (
                      <DiscountSelector
                        value={field.state.value}
                        onChange={(discountId) => field.handleChange(discountId)}
                      />
                    )}
                  </form.Field>

                  {/* Warranty */}
                  <form.Field name="warranty">
                    {(field) => (
                      <FormField field={field} label="Warranty">
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g., 1 year manufacturer warranty"
                          variant="dark"
                        />
                      </FormField>
                    )}
                  </form.Field>

                  {/* Product Tags */}
                  <form.Field name="tags">
                    {(field) => (
                      <TagInput
                        value={field.state.value}
                        onChange={(tags) => field.handleChange(tags)}
                        maxTags={20}
                        placeholder="Add tag (e.g., summer, sale, trending)"
                      />
                    )}
                  </form.Field>

                  <form.Field
                    name="youtubeUrl"
                    validators={{
                      onBlur: ({ value }) =>
                        value &&
                        !/^https?:\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]+$/.test(
                          value
                        )
                          ? 'Please enter a valid YouTube URL.'
                          : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field} label="YouTube URL (Optional)">
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g., https://www.youtube.com/embed/xyz123"
                          variant="dark"
                        />
                      </FormField>
                    )}
                  </form.Field>
                </div>
              )}

              {activeTab === 'variants' && (
                <div className="space-y-6">
                  <form.Field name="variants">
                    {(field) => (
                      <VariantManager
                        variants={field.state.value}
                        onChange={(variants) => field.handleChange(variants)}
                        basePrice={form.getFieldValue('price') || 0}
                        productName={form.getFieldValue('name') || 'Product'}
                      />
                    )}
                  </form.Field>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <form.Field name="shipping">
                    {(field) => (
                      <DimensionsInput
                        value={field.state.value}
                        onChange={(value) => field.handleChange(value)}
                      />
                    )}
                  </form.Field>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <form.Field name="seo">
                    {(field) => (
                      <SEOFields
                        value={field.state.value}
                        onChange={(value) => field.handleChange(value)}
                        productName={form.getFieldValue('name') || ''}
                        autoGenerateSlug
                      />
                    )}
                  </form.Field>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <div className="flex gap-4 pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || isUpdating}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSubmitting || isUpdating ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Updating Product...
                      </>
                    ) : (
                      'Update Product'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/all-products')}
                    className="px-8 py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;
