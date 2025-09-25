'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/core/Button';
import { Input } from '../../../components/ui/core/Input';
import { Select } from '../../../components/ui/core/Select';
import { getShopCategoryOptions } from '../../../lib/data/shop-categories';
import { createShop, CreateShopData } from '../../../lib/api/seller';
import { Store, MapPin, Clock, Globe, FileText, Tag } from 'lucide-react';

interface CreateShopProps {
  sellerId?: string;
  setActiveStep?: (step: number) => void;
}

interface ShopFormData {
  businessName: string;
  bio: string;
  category: string;
  address: string;
  openingHours: string;
  website: string;
}

/**
 * Validate bio word count (max 100 words)
 */
function validateBio(bio: string): string | undefined {
  if (!bio.trim()) {
    return 'Bio is required';
  }

  const wordCount = bio.trim().split(/\s+/).length;
  if (wordCount > 100) {
    return `Bio must be 100 words or less (current: ${wordCount} words)`;
  }

  if (bio.trim().length < 10) {
    return 'Bio must be at least 10 characters long';
  }

  return undefined;
}

/**
 * Validate website URL format
 */
function validateWebsite(website: string): string | undefined {
  if (!website.trim()) {
    return undefined; // Website is optional
  }

  const urlPattern = /^https?:\/\/.+\..+/i;
  if (!urlPattern.test(website)) {
    return 'Please enter a valid website URL (e.g., https://example.com)';
  }

  return undefined;
}

/**
 * Validate opening hours format
 */
function validateOpeningHours(hours: string): string | undefined {
  if (!hours.trim()) {
    return 'Opening hours are required';
  }

  if (hours.trim().length < 5) {
    return 'Please provide detailed opening hours (e.g., "Mon-Fri 9AM-6PM")';
  }

  return undefined;
}

const CreateShop: React.FC<CreateShopProps> = ({ sellerId, setActiveStep }) => {
  const [wordCount, setWordCount] = useState(0);
  const categoryOptions = getShopCategoryOptions();

  const { mutate: createShopMutation, isPending } = useMutation({
    mutationFn: async (shopData: ShopFormData) => {
      const createShopData: CreateShopData = {
        businessName: shopData.businessName,
        bio: shopData.bio,
        category: shopData.category,
        address: shopData.address,
        openingHours: shopData.openingHours,
        website: shopData.website || undefined,
      };

      return await createShop(createShopData);
    },
    onSuccess: () => {
      toast.success('Shop created successfully! 🎉');
      // Move to next step or redirect
      if (setActiveStep) {
        setActiveStep(3); // Advance to Connect Bank step
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create shop');
    },
  });

  const form = useForm({
    defaultValues: {
      businessName: '',
      bio: '',
      category: '',
      address: '',
      openingHours: '',
      website: '',
    } as ShopFormData,
    onSubmit: async ({ value }) => {
      createShopMutation(value);
    },
  });

  // Handle bio word count
  const handleBioChange = (bio: string) => {
    const words = bio
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <Store className="h-8 w-8 text-brand-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">
          Create Your Shop
        </h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Set up your shop profile to start selling on our platform
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Business Name */}
        <form.Field
          name="businessName"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return 'Business name is required';
              if (value.trim().length < 2)
                return 'Business name must be at least 2 characters';
              if (value.length > 100)
                return 'Business name must be less than 100 characters';
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                <Store className="inline h-4 w-4 mr-2" />
                Business Name *
              </label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter your business name"
                className={
                  field.state.meta.errors.length > 0 ? 'border-red-500' : ''
                }
                disabled={isPending}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Category */}
        <form.Field
          name="category"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return 'Please select a category';
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                <Tag className="inline h-4 w-4 mr-2" />
                Category *
              </label>
              <Select
                options={categoryOptions}
                value={field.state.value}
                onChange={field.handleChange}
                placeholder="Select your business category"
                disabled={isPending}
                className={
                  field.state.meta.errors.length > 0 ? 'border-red-500' : ''
                }
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Bio */}
        <form.Field
          name="bio"
          validators={{
            onChange: ({ value }) => validateBio(value),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                <FileText className="inline h-4 w-4 mr-2" />
                Business Description *
              </label>
              <div className="relative">
                <textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    handleBioChange(e.target.value);
                  }}
                  placeholder="Describe your business, products, and what makes you unique..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none ${
                    field.state.meta.errors.length > 0
                      ? 'border-red-500'
                      : 'border-border'
                  }`}
                  rows={4}
                  maxLength={1000}
                  disabled={isPending}
                />
                <div className="absolute bottom-2 right-2 text-xs text-text-secondary">
                  {wordCount}/100 words
                </div>
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Address */}
        <form.Field
          name="address"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return 'Business address is required';
              if (value.trim().length < 10)
                return 'Please provide a complete address';
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                <MapPin className="inline h-4 w-4 mr-2" />
                Business Address *
              </label>
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter your complete business address"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none ${
                  field.state.meta.errors.length > 0
                    ? 'border-red-500'
                    : 'border-border'
                }`}
                rows={3}
                disabled={isPending}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Opening Hours */}
        <form.Field
          name="openingHours"
          validators={{
            onChange: ({ value }) => validateOpeningHours(value),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                <Clock className="inline h-4 w-4 mr-2" />
                Opening Hours *
              </label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                className={
                  field.state.meta.errors.length > 0 ? 'border-red-500' : ''
                }
                disabled={isPending}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
              <p className="text-xs text-text-secondary">
                Specify your business operating hours (e.g., "Mon-Fri 9AM-6PM,
                Sat 10AM-4PM")
              </p>
            </div>
          )}
        </form.Field>

        {/* Website (Optional) */}
        <form.Field
          name="website"
          validators={{
            onChange: ({ value }) => validateWebsite(value),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                <Globe className="inline h-4 w-4 mr-2" />
                Website{' '}
                <span className="text-text-secondary font-normal">
                  (Optional)
                </span>
              </label>
              <Input
                id={field.name}
                name={field.name}
                type="url"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://your-website.com"
                className={
                  field.state.meta.errors.length > 0 ? 'border-red-500' : ''
                }
                disabled={isPending}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Submit Button */}
        <div className="pt-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isPending}
              >
                {isPending ? 'Creating Shop...' : 'Create Shop'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>

      {/* Info */}
      <div className="text-center">
        <p className="text-sm text-text-secondary">
          You can always update your shop information later from your dashboard
        </p>
      </div>
    </div>
  );
};

export default CreateShop;
