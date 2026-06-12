'use client';

import { createLogger } from '@tec-shop/next-logger';
import { useForm } from '@tanstack/react-form';
import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const logger = createLogger('seller-ui:edit-product');
import { useParams } from 'next/navigation';
import { Package, DollarSign, Tag, Boxes } from 'lucide-react';
import {
  useProduct,
  useUpdateProduct,
} from '../../../../../../../hooks/useProducts';
import { Alert } from '../../../../../../../components/ui/core/Alert';
import { Input } from '../../../../../../../components/ui/core/Input';
import { Select } from '../../../../../../../components/ui/core/Select';
import { FormField } from '../../../../../../../components/ui/form/FormField';
import { ProductImageUploader } from '../../../../../../../components/ui/form/ProductImageUploader';
import { RichTextEditor } from '../../../../../../../components/ui/form/RichTextEditor';
import {
  VariantManager,
  type ProductVariant,
} from '../../../../../../../components/ui/form/VariantManager';
import { DimensionsInput } from '../../../../../../../components/ui/form/DimensionsInput';
import { SEOFields } from '../../../../../../../components/ui/form/SEOFields';
import {
  CategorySelector,
  type Category,
} from '../../../../../../../components/ui/form/CategorySelector';
import {
  BrandSelector,
  type Brand,
} from '../../../../../../../components/ui/form/BrandSelector';
import { TagInput } from '../../../../../../../components/ui/form/TagInput';
import { DiscountSelector } from '../../../../../../../components/ui/form/DiscountSelector';
import { Breadcrumb } from '../../../../../../../components/navigation/Breadcrumb';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';

const Page = () => {
  const t = useTranslations('EditProduct');
  const tCreate = useTranslations('CreateProduct');
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading, error: fetchError } = useProduct(productId);
  const { mutate: updateProductMutation, isPending: isUpdating } =
    useUpdateProduct(productId);

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

  const PRODUCT_TYPES = [
    { value: 'simple', label: tCreate('productTypeSimple') },
    { value: 'variable', label: tCreate('productTypeVariable') },
    { value: 'digital', label: tCreate('productTypeDigital') },
  ];

  const PRODUCT_STATUS = [
    { value: 'draft', label: tCreate('statusDraft') },
    { value: 'published', label: tCreate('statusPublished') },
    { value: 'scheduled', label: tCreate('statusScheduled') },
  ];

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

        const allImageUrls = uploadedImageUrls.filter(Boolean);

        const productData = {
          ...value,
          imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
          newImages: undefined,
          attributes: { ...dynamicAttributes, ...value.attributes },
        };

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
        logger.error('Failed to update product:', { error });
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Failed to update product. Please try again.'
        );
      }
    },
  });

  useEffect(() => {
    if (product) {
      form.setFieldValue('name', product.name);
      form.setFieldValue('description', product.description);
      form.setFieldValue('categoryId', product.categoryId);
      form.setFieldValue('brandId', product.brandId || '');
      form.setFieldValue(
        'productType',
        product.productType.toLowerCase() as 'simple' | 'variable' | 'digital'
      );
      form.setFieldValue('price', product.price);
      form.setFieldValue('salePrice', product.salePrice || undefined);
      form.setFieldValue('stock', product.stock);
      form.setFieldValue('hasVariants', product.hasVariants);
      form.setFieldValue(
        'variants',
        (product.variants as ProductVariant[]) || []
      );
      form.setFieldValue('attributes', product.attributes || {});
      form.setFieldValue(
        'shipping',
        product.shipping
          ? (product.shipping as {
              weight: number;
              dimensions: { length: number; width: number; height: number };
              freeShipping: boolean;
              shippingClass: 'standard' | 'express' | 'fragile' | 'heavy';
            })
          : {
              weight: 0,
              dimensions: { length: 0, width: 0, height: 0 },
              freeShipping: false,
              shippingClass: 'standard' as const,
            }
      );
      form.setFieldValue(
        'seo',
        product.seo
          ? (product.seo as {
              title: string;
              description: string;
              slug: string;
              keywords: string[];
            })
          : {
              title: '',
              description: '',
              slug: '',
              keywords: [],
            }
      );
      form.setFieldValue('warranty', product.warranty || '');
      form.setFieldValue('youtubeUrl', product.youtubeUrl || '');
      form.setFieldValue('tags', product.tags || []);
      form.setFieldValue('discountCodeId', undefined);
      form.setFieldValue(
        'status',
        product.status.toLowerCase() as 'draft' | 'published' | 'scheduled'
      );
      form.setFieldValue('isFeatured', product.isFeatured);

      setDynamicAttributes(product.attributes || {});
      setUploadedImageUrls(product.images || []);
    }
  }, [product]);

  const handleImageUploaded = (url: string, index: number) => {
    setUploadedImageUrls((prev) => {
      const updated = [...prev];
      while (updated.length < 4) {
        updated.push('');
      }
      updated[index] = url;
      return updated;
    });

    setProductImages((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const handleImageRemove = (index: number) => {
    setUploadedImageUrls((prev) => {
      const updated = [...prev];
      while (updated.length < 4) {
        updated.push('');
      }
      updated[index] = '';
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="w-full mx-auto p-8 text-gray-900">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="w-full mx-auto p-8 text-gray-900">
        <Alert
          variant="error"
          title={t('notFoundTitle')}
          description={t('notFoundDesc')}
        />
        <button
          onClick={() => router.push('/dashboard/all-products')}
          className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-gray-900 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          {t('backToProducts')}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'basic' as const, label: tCreate('tabBasicInfo'), icon: Package },
    { id: 'variants' as const, label: tCreate('tabVariants'), icon: Boxes },
    { id: 'shipping' as const, label: tCreate('tabShipping'), icon: Package },
    { id: 'seo' as const, label: tCreate('tabSeo'), icon: Tag },
  ];

  return (
    <div className="w-full mx-auto p-8 text-gray-900">
      <h2 className="text-2xl py-2 font-semibold font-heading text-gray-900">
        {t('pageTitle')}
      </h2>

      <Breadcrumb
        items={[
          { label: tCreate('breadcrumbDashboard'), href: '/dashboard' },
          { label: t('breadcrumbProducts'), href: '/dashboard/all-products' },
          { label: t('breadcrumbEdit') },
        ]}
      />

      {submitSuccess && (
        <Alert
          variant="success"
          title={t('successTitle')}
          description={t('successDesc')}
        />
      )}

      {submitError && (
        <Alert
          variant="error"
          title={t('errorTitle')}
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
          <div className="lg:col-span-1 space-y-6">
            <ProductImageUploader
              images={productImages}
              onChange={setProductImages}
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemove}
              initialUrls={uploadedImageUrls}
            />

            <div className="bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Tag size={20} className="text-green-400" />
                {tCreate('statusTitle')}
              </h3>

              <form.Field name="status">
                {(field) => (
                  <FormField field={field} label={tCreate('statusFieldLabel')}>
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
                      className="w-4 h-4 rounded bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-blue-600"
                    />
                    <label
                      htmlFor="isFeatured"
                      className="text-sm text-gray-600 dark:text-gray-300"
                    >
                      {tCreate('markAsFeatured')}
                    </label>
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <form.Field
                    name="name"
                    validators={{
                      onChange: ({ value }) =>
                        !value
                          ? tCreate('validationNameRequired')
                          : value.length < 3
                          ? tCreate('validationNameMinLength')
                          : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field} label={tCreate('fieldProductName')} required>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={tCreate('placeholderProductName')}
                          variant="dark"
                        />
                      </FormField>
                    )}
                  </form.Field>

                  <form.Field
                    name="description"
                    validators={{
                      onChange: ({ value }) => {
                        const wordCount = value
                          .split(/\s+/)
                          .filter(Boolean).length;
                        return wordCount < 50
                          ? tCreate('validationDescMinWords')
                          : wordCount > 200
                          ? tCreate('validationDescMaxWords')
                          : undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <FormField
                        field={field}
                        label={tCreate('fieldProductDesc')}
                        required
                      >
                        <RichTextEditor
                          value={field.state.value}
                          onChange={(value) => field.handleChange(value)}
                          onBlur={field.handleBlur}
                          placeholder={tCreate('placeholderProductDesc')}
                          minWords={50}
                          maxWords={200}
                        />
                      </FormField>
                    )}
                  </form.Field>

                  <form.Field
                    name="categoryId"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? tCreate('validationCategoryRequired') : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field} label={tCreate('fieldCategory')} required>
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

                  <form.Field name="productType">
                    {(field) => (
                      <FormField field={field} label={tCreate('fieldProductType')} required>
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

                  <div className="bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <DollarSign size={20} className="text-green-400" />
                      {tCreate('pricingTitle')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <form.Field
                        name="price"
                        validators={{
                          onChange: ({ value }) =>
                            value <= 0
                              ? tCreate('validationPricePositive')
                              : undefined,
                        }}
                      >
                        {(field) => (
                          <FormField
                            field={field}
                            label={tCreate('fieldRegularPrice')}
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
                        {(field) => {
                          const regularPrice = form.getFieldValue('price') || 0;
                          const salePrice = field.state.value || 0;
                          const discount =
                            regularPrice > 0 &&
                            salePrice > 0 &&
                            salePrice < regularPrice
                              ? Math.round(
                                  ((regularPrice - salePrice) / regularPrice) *
                                    100
                                )
                              : 0;

                          return (
                            <FormField field={field} label={tCreate('fieldSalePrice')}>
                              <div className="space-y-2">
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
                                  placeholder={tCreate('placeholderSalePrice')}
                                  variant="dark"
                                />
                                {discount > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                                      {tCreate('salePriceOff', { discount })}
                                    </span>
                                    <span className="text-gray-500">
                                      {tCreate('salePriceSave', { amount: `$${(regularPrice - salePrice).toFixed(2)}` })}
                                    </span>
                                  </div>
                                )}
                                <p className="text-xs text-gray-500">
                                  {tCreate.rich('salePriceNote', {
                                    offers: (chunks) => (
                                      <span className="font-medium text-red-600">{chunks}</span>
                                    ),
                                  })}
                                </p>
                              </div>
                            </FormField>
                          );
                        }}
                      </form.Field>
                    </div>

                    <form.Field
                      name="stock"
                      validators={{
                        onChange: ({ value }) =>
                          value < 0 ? tCreate('validationStockNonNegative') : undefined,
                      }}
                    >
                      {(field) => (
                        <FormField
                          field={field}
                          label={tCreate('fieldStockQty')}
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

                  <form.Field name="discountCodeId">
                    {(field) => (
                      <DiscountSelector
                        value={field.state.value}
                        onChange={(discountId) =>
                          field.handleChange(discountId)
                        }
                      />
                    )}
                  </form.Field>

                  <form.Field name="warranty">
                    {(field) => (
                      <FormField field={field} label={tCreate('fieldWarranty')}>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={tCreate('placeholderWarranty')}
                          variant="dark"
                        />
                      </FormField>
                    )}
                  </form.Field>

                  <form.Field name="tags">
                    {(field) => (
                      <TagInput
                        value={field.state.value}
                        onChange={(tags) => field.handleChange(tags)}
                        maxTags={20}
                        placeholder={tCreate('placeholderTag')}
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
                          ? tCreate('validationYoutubeUrl')
                          : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field} label={tCreate('fieldYoutubeUrl')}>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={tCreate('placeholderYoutubeUrl')}
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
                        onChange={(variants) => {
                          field.handleChange(variants);
                          form.setFieldValue(
                            'hasVariants',
                            variants.length > 0
                          );
                        }}
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

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
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
                        {t('submitUpdating')}
                      </>
                    ) : (
                      t('submitUpdate')
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/all-products')}
                    className="px-8 py-3 border border-slate-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {t('cancel')}
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
