'use client';

import { useForm } from '@tanstack/react-form';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { createProduct } from '../../../../lib/api/products';
import { Alert } from '../../../../components/ui/core/Alert';
import { Input } from '../../../../components/ui/core/Input';
import { Textarea } from '../../../../components/ui/core/Textarea';
import { Select } from '../../../../components/ui/core/Select';
import { FormField } from '../../../../components/ui/form/FormField';
import { ProductImageUploader } from '../../../../components/ui/form/ProductImageUploader';
import { Breadcrumb } from '../../../../components/navigation/Breadcrumb';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: File[];
}

const PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'toys', label: 'Toys & Games' },
];

const Page = () => {
  const router = useRouter();
  const [productImages, setProductImages] = useState<(File | null)[]>([null, null, null, null]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: '',
      images: [],
    },
    onSubmit: async ({ value }) => {
      try {
        setSubmitError(null);
        setSubmitSuccess(false);

        const validImages = productImages.filter((img): img is File => img !== null);

        if (validImages.length === 0) {
          setSubmitError('At least one product image is required');
          return;
        }

        const productData = { ...value, images: validImages };
        const createdProduct = await createProduct(productData);
        console.log('Product created successfully:', createdProduct);

        setSubmitSuccess(true);

        setTimeout(() => {
          form.reset();
          setProductImages([null, null, null, null]);
          router.push('/dashboard/products');
        }, 2000);
      } catch (error) {
        console.error('Failed to create product:', error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Failed to create product. Please try again.'
        );
      }
    },
  });

  return (
    <div className="w-full mx-auto p-8 text-white">
      <Toaster position="top-right" richColors />

      <h2 className="text-2xl py-2 font-semibold font-heading text-white">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Image Upload */}
        <div className="lg:col-span-1">
          <ProductImageUploader
            images={productImages}
            onChange={setProductImages}
          />
        </div>

        {/* Right Side - Product Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
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
                    placeholder="Enter product name"
                    variant="dark"
                  />
                </FormField>
              )}
            </form.Field>

            <form.Field
              name="description"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? 'Product description is required'
                    : value.length < 10
                    ? 'Description must be at least 10 characters'
                    : undefined,
              }}
            >
              {(field) => (
                <FormField field={field} label="Product Description" required>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter product description"
                    rows={4}
                    variant="dark"
                  />
                </FormField>
              )}
            </form.Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.Field
                name="price"
                validators={{
                  onChange: ({ value }) =>
                    value <= 0 ? 'Price must be greater than 0' : undefined,
                }}
              >
                {(field) => (
                  <FormField field={field} label="Price ($)" required>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      variant="dark"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field
                name="stock"
                validators={{
                  onChange: ({ value }) =>
                    value < 0 ? 'Stock cannot be negative' : undefined,
                }}
              >
                {(field) => (
                  <FormField field={field} label="Stock Quantity" required>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="0"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(parseInt(e.target.value, 10) || 0)
                      }
                      placeholder="0"
                      variant="dark"
                    />
                  </FormField>
                )}
              </form.Field>
            </div>

            <form.Field
              name="category"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Please select a category' : undefined,
              }}
            >
              {(field) => (
                <FormField field={field} label="Category" required>
                  <Select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(value) => field.handleChange(value)}
                    options={PRODUCT_CATEGORIES}
                    placeholder="Select a category"
                    variant="dark"
                  />
                </FormField>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
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
                        Creating...
                      </span>
                    ) : (
                      'Create Product'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => form.reset()}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
