'use client';

import { useForm } from '@tanstack/react-form';
import { ChevronRight, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImagePlaceHolder from '../../../../components/image-placeholder';
import { createProduct } from '../../../../lib/api/products';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: File[];
}

const Page = () => {
  const router = useRouter();

  // State for managing product images
  const [productImages, setProductImages] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // TanStack Form initialization
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

        // Filter out null images
        const validImages = productImages.filter(
          (img): img is File => img !== null
        );

        // Validate at least one image
        if (validImages.length === 0) {
          setSubmitError('At least one product image is required');
          return;
        }

        const productData = {
          ...value,
          images: validImages,
        };

        // Call API to create product
        const createdProduct = await createProduct(productData);
        console.log('Product created successfully:', createdProduct);

        // Show success message
        setSubmitSuccess(true);

        // Reset form after 2 seconds and redirect to products list
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

  // Handle image changes
  const handleImageChange = (file: File | null, index: number) => {
    setProductImages((prev) => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
  };

  // Handle image removal
  const handleImageRemove = (index: number) => {
    setProductImages((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  return (
    <div className="w-full mx-auto p-8 text-white">
      {/* Heading & Breadcrumbs */}
      <h2 className="text-2xl py-2 font-semibold font-heading text-white">
        Create Product
      </h2>
      <div className="flex items-center mb-6">
        <span className="text-[#80Deea] cursor-pointer">Dashboard</span>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span className="text-gray-400">Create Product</span>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-400" size={24} />
          <div>
            <h3 className="font-semibold text-green-400">Product Created Successfully!</h3>
            <p className="text-sm text-green-300">Redirecting to products list...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <h3 className="font-semibold text-red-400">Error Creating Product</h3>
          <p className="text-sm text-red-300">{submitError}</p>
        </div>
      )}

      {/* Main Layout: Images on Left, Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Image Upload Section */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Product Images
          </h3>

          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Main Image *
            </label>
            <ImagePlaceHolder
              size="large"
              small={false}
              index={0}
              onImageChange={handleImageChange}
              onRemove={handleImageRemove}
              setOpenImageModal={setOpenImageModal}
              defaultImage={
                productImages[0]
                  ? URL.createObjectURL(productImages[0])
                  : null
              }
            />
            <p className="mt-2 text-xs text-gray-400">
              Upload the main product image (Required)
            </p>
          </div>

          {/* Additional Images Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Images (Optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((idx) => (
                <ImagePlaceHolder
                  key={idx}
                  size="small"
                  small={true}
                  index={idx}
                  onImageChange={handleImageChange}
                  onRemove={handleImageRemove}
                  setOpenImageModal={setOpenImageModal}
                  defaultImage={
                    productImages[idx]
                      ? URL.createObjectURL(productImages[idx])
                      : null
                  }
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Upload up to 3 additional images
            </p>
          </div>

          {/* Image Upload Tips */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">
              📸 Image Guidelines
            </h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Use high-quality images (min 800x800px)</li>
              <li>• Supported formats: JPG, PNG, WebP</li>
              <li>• Max file size: 5MB per image</li>
              <li>• Use clear, well-lit photos</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Product Details Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
        {/* Product Name Field */}
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Product name is required' :
              value.length < 3 ? 'Product name must be at least 3 characters' :
              undefined,
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Product Name *
              </label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter product name"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-400">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Product Description Field */}
        <form.Field
          name="description"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Product description is required' :
              value.length < 10 ? 'Description must be at least 10 characters' :
              undefined,
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Product Description *
              </label>
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter product description"
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-400">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Price and Stock Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Field */}
          <form.Field
            name="price"
            validators={{
              onChange: ({ value }) =>
                value <= 0 ? 'Price must be greater than 0' : undefined,
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Price ($) *
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-sm text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Stock Field */}
          <form.Field
            name="stock"
            validators={{
              onChange: ({ value }) =>
                value < 0 ? 'Stock cannot be negative' : undefined,
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Stock Quantity *
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min="0"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-sm text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>

        {/* Category Field */}
        <form.Field
          name="category"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Please select a category' : undefined,
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Category *
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="toys">Toys & Games</option>
              </select>
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-400">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Submit Button */}
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
