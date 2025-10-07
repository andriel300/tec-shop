import React, { useState } from 'react';
import { Button } from '../ui/core/Button';
import { Input } from '../ui/core/Input';
import { Textarea } from '../ui/core/Textarea';
import { Select } from '../ui/core/Select';
import type { CreateDiscountData, DiscountType } from '../../lib/api/discounts';

interface DiscountFormProps {
  onSubmit: (data: CreateDiscountData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateDiscountData>;
}

/**
 * Discount Form Component
 *
 * A comprehensive form for creating/editing discount codes
 *
 * Features:
 * - Type-specific validation (percentage max 100%)
 * - Date validation (end date must be after start date)
 * - Optional fields with smart defaults
 * - Real-time code preview
 */
export function DiscountForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: DiscountFormProps) {
  const [formData, setFormData] = useState<CreateDiscountData>({
    publicName: initialData?.publicName || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    discountType: initialData?.discountType || 'PERCENTAGE',
    discountValue: initialData?.discountValue || 0.01,
    usageLimit: initialData?.usageLimit,
    maxUsesPerCustomer: initialData?.maxUsesPerCustomer,
    startDate: initialData?.startDate,
    endDate: initialData?.endDate,
    minimumPurchase: initialData?.minimumPurchase,
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate code from public name
  const handlePublicNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      publicName: value,
      // Auto-generate code if it is empty
      code:
        prev.code ||
        value
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/g, ''),
    }));
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.publicName.trim()) {
      newErrors.publicName = 'Public name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code =
        'Code can only contain uppercase letters, numbers, hyphens, and underscores';
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (
      formData.discountType === 'PERCENTAGE' &&
      formData.discountValue > 100
    ) {
      newErrors.discountValue = 'Percentage cannot exceed 100%';
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate <= formData.startDate
    ) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Public Name <span className="text-red-400">*</span>
          </label>
          <Input
            variant="dark"
            type="text"
            value={formData.publicName}
            onChange={(e) => handlePublicNameChange(e.target.value)}
            placeholder="e.g., Summer Sale 2025"
            className={errors.publicName ? 'border-red-500' : ''}
          />
          {errors.publicName && (
            <p className="mt-1 text-sm text-red-400">{errors.publicName}</p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            Customer-facing name displayed at checkout
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Discount Code <span className="text-red-400">*</span>
          </label>
          <Input
            variant="dark"
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="e.g., SUMMER2025"
            className={errors.code ? 'border-red-500' : ''}
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-400">{errors.code}</p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            Unique code customers will enter (auto-converted to uppercase)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <Textarea
            variant="dark"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Internal notes about this discount (not shown to customers)"
            rows={3}
          />
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="space-y-4 pt-6 border-t border-gray-800">
        <h3 className="text-lg font-medium text-white">
          Discount Configuration
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discount Type <span className="text-red-400">*</span>
            </label>
            <Select
              variant="dark"
              value={formData.discountType}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  discountType: value as DiscountType,
                })
              }
              options={[
                { value: 'PERCENTAGE', label: 'Percentage Off' },
                { value: 'FIXED_AMOUNT', label: 'Fixed Amount Off' },
                { value: 'FREE_SHIPPING', label: 'Free Shipping' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discount Value <span className="text-red-400">*</span>
            </label>
            <Input
              variant="dark"
              type="number"
              step="0.01"
              min="0.01"
              max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
              value={formData.discountValue}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({
                  ...formData,
                  discountValue: isNaN(value) ? 0.01 : value,
                });
              }}
              className={errors.discountValue ? 'border-red-500' : ''}
            />
            {errors.discountValue && (
              <p className="mt-1 text-sm text-red-400">
                {errors.discountValue}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-400">
              {formData.discountType === 'PERCENTAGE' &&
                'Enter percentage (0-100)'}
              {formData.discountType === 'FIXED_AMOUNT' &&
                'Enter dollar amount'}
              {formData.discountType === 'FREE_SHIPPING' &&
                'Value not used for free shipping'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Purchase Amount
          </label>
          <Input
            variant="dark"
            type="number"
            step="0.01"
            min="0"
            value={formData.minimumPurchase || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimumPurchase: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            placeholder="No minimum"
          />
          <p className="mt-1 text-sm text-gray-400">
            Optional: Minimum order value required to use this code
          </p>
        </div>
      </div>

      {/* Usage Limits */}
      <div className="space-y-4 pt-6 border-t border-gray-800">
        <h3 className="text-lg font-medium text-white">Usage Limits</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Usage Limit
            </label>
            <Input
              variant="dark"
              type="number"
              min="1"
              value={formData.usageLimit || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  usageLimit: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              placeholder="Unlimited"
            />
            <p className="mt-1 text-sm text-gray-400">
              Maximum times this code can be used
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Per Customer Limit
            </label>
            <Input
              variant="dark"
              type="number"
              min="1"
              value={formData.maxUsesPerCustomer || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxUsesPerCustomer: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              placeholder="Unlimited"
            />
            <p className="mt-1 text-sm text-gray-400">
              Maximum uses per customer
            </p>
          </div>
        </div>
      </div>

      {/* Validity Period */}
      <div className="space-y-4 pt-6 border-t border-gray-800">
        <h3 className="text-lg font-medium text-white">Validity Period</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-3 disabled:cursor-not-allowed disabled:opacity-50 border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  // Create date at start of day in local timezone
                  const date = new Date(value + 'T00:00:00');
                  setFormData({
                    ...formData,
                    startDate: date,
                  });
                } else {
                  setFormData({
                    ...formData,
                    startDate: undefined,
                  });
                }
              }}
            />
            <p className="mt-1 text-sm text-gray-400">
              When this discount becomes active (defaults to now)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-3 disabled:cursor-not-allowed disabled:opacity-50 border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ${
                errors.endDate ? 'border-red-500' : ''
              }`}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  // Create date at end of day in local timezone
                  const date = new Date(value + 'T23:59:59');
                  setFormData({
                    ...formData,
                    endDate: date,
                  });
                } else {
                  setFormData({
                    ...formData,
                    endDate: undefined,
                  });
                }
              }}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>
            )}
            <p className="mt-1 text-sm text-gray-400">
              When this discount expires (no expiry if empty)
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="pt-6 border-t border-gray-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-white">Active</span>
            <p className="text-sm text-gray-400">
              Customers can use this discount code
            </p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end text-white gap-3 pt-6 border-t border-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : initialData
            ? 'Update Discount'
            : 'Create Discount'}
        </Button>
      </div>
    </form>
  );
}
