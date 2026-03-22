'use client';

import { createLogger } from '@tec-shop/next-logger';
import { useForm } from '@tanstack/react-form';
import React, { useState } from 'react';
import { Package, Boxes, Tag } from 'lucide-react';

const logger = createLogger('seller-ui:create-product');

import { createProduct } from '../../../../../lib/api/products';
import { Alert } from '../../../../../components/ui/core/Alert';
import {
  VariantManager,
  type ProductVariant,
} from '../../../../../components/ui/form/VariantManager';
import { DimensionsInput } from '../../../../../components/ui/form/DimensionsInput';
import { SEOFields } from '../../../../../components/ui/form/SEOFields';
import { ProductImageUploader } from '../../../../../components/ui/form/ProductImageUploader';
import type { Category } from '../../../../../components/ui/form/CategorySelector';
import type { Brand } from '../../../../../components/ui/form/BrandSelector';
import { Breadcrumb } from '../../../../../components/navigation/Breadcrumb';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';
import { BasicInfoTab } from './_components/BasicInfoTab';
import { ProductStatusCard } from './_components/ProductStatusCard';
import { ProductFormActions } from './_components/ProductFormActions';

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: Package },
  { id: 'variants', label: 'Variants', icon: Boxes },
  { id: 'shipping', label: 'Shipping', icon: Package },
  { id: 'seo', label: 'SEO', icon: Tag },
] as const;

type TabId = (typeof TABS)[number]['id'];

const Page = () => {
  const router = useRouter();
  const [productImages, setProductImages] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [, setSelectedCategory] = useState<Category | null>(null);
  const [, setSelectedBrand] = useState<Brand | null>(null);
  const [dynamicAttributes, setDynamicAttributes] = useState<
    Record<string, unknown>
  >({});
  const [activeTab, setActiveTab] = useState<TabId>('basic');

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
        shippingClass: 'standard' as
          | 'standard'
          | 'express'
          | 'fragile'
          | 'heavy',
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

        const validImages = productImages.filter(
          (img): img is File => img !== null
        );

        if (validImages.length === 0) {
          setSubmitError('At least one product image is required');
          return;
        }

        const productData = {
          ...value,
          images: validImages,
          attributes: { ...dynamicAttributes, ...value.attributes },
          productType: value.productType as 'simple' | 'variable' | 'digital',
          status: value.status as 'draft' | 'published' | 'scheduled',
        };

        logger.debug('Submitting product:', { data: productData });
        await createProduct(productData);
        logger.info('Product created successfully:');

        setSubmitSuccess(true);

        setTimeout(() => {
          form.reset();
          setProductImages([null, null, null, null]);
          router.push('/dashboard/all-products');
        }, 2000);
      } catch (error) {
        logger.error('Failed to create product:', { error });
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Failed to create product. Please try again.'
        );
      }
    },
  });

  const handleReset = () => {
    form.reset();
    setProductImages([null, null, null, null]);
    setSelectedCategory(null);
    setSelectedBrand(null);
    setDynamicAttributes({});
  };

  return (
    <div className="w-full mx-auto p-8 bg-surface-dark text-gray-900">
      <h2 className="text-2xl py-2 font-semibold font-heading text-gray-900">
        Create Product
      </h2>

      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Create Product' },
        ]}
      />

      {submitSuccess && (
        <Alert
          variant="success"
          title="Product Created Successfully!"
          description="Redirecting to products list..."
        />
      )}

      {submitError && (
        <Alert
          variant="error"
          title="Error Creating Product"
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
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ProductImageUploader
              images={productImages}
              onChange={setProductImages}
            />
            <ProductStatusCard form={form} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-surface-container-highest">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-primary-600 text-brand-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
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
                <BasicInfoTab
                  form={form}
                  setSelectedCategory={setSelectedCategory}
                  setSelectedBrand={setSelectedBrand}
                  setDynamicAttributes={setDynamicAttributes}
                />
              )}

              {activeTab === 'variants' && (
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
              )}

              {activeTab === 'shipping' && (
                <form.Field name="shipping">
                  {(field) => (
                    <DimensionsInput
                      value={field.state.value}
                      onChange={(value) => field.handleChange(value)}
                    />
                  )}
                </form.Field>
              )}

              {activeTab === 'seo' && (
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
              )}
            </div>

            <ProductFormActions
              form={form}
              onReset={handleReset}
              onCancel={() => router.push('/dashboard/all-products')}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;
