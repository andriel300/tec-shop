import React, { useState } from 'react';
import { Button } from '../ui/core/Button';
import { Input } from '../ui/core/Input';
import { Textarea } from '../ui/core/Textarea';
import {
  Tag,
  Percent,
  Users,
  Calendar,
  Truck,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import type { CreateDiscountData, DiscountType } from '../../lib/api/discounts';

interface DiscountFormProps {
  onSubmit: (data: CreateDiscountData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateDiscountData>;
}

const dateInputClass =
  'flex h-10 w-full rounded-lg border bg-surface-container border-surface-container-highest text-gray-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-colors';

const DISCOUNT_TYPE_OPTIONS: {
  value: DiscountType;
  label: string;
  short: string;
  icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { value: 'PERCENTAGE', label: 'Percentage Off', short: '%', icon: Percent },
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount', short: '$', icon: DollarSign },
  { value: 'FREE_SHIPPING', label: 'Free Shipping', short: '✈', icon: Truck },
];

export function DiscountForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: DiscountFormProps) {
  const parseDate = (dateString?: string | Date | null): Date | undefined => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) return dateString;
    return new Date(dateString);
  };

  const [formData, setFormData] = useState<CreateDiscountData>({
    publicName: initialData?.publicName || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    discountType: initialData?.discountType || 'PERCENTAGE',
    discountValue: initialData?.discountValue || 0.01,
    usageLimit: initialData?.usageLimit,
    maxUsesPerCustomer: initialData?.maxUsesPerCustomer,
    startDate: parseDate(initialData?.startDate),
    endDate: parseDate(initialData?.endDate),
    minimumPurchase: initialData?.minimumPurchase,
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [codeCopied, setCodeCopied] = useState(false);

  const handlePublicNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      publicName: value,
      code:
        prev.code ||
        value
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/g, ''),
    }));
  };

  const handleCopyCode = () => {
    if (formData.code) {
      navigator.clipboard.writeText(formData.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

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

  const isFreeShipping = formData.discountType === 'FREE_SHIPPING';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section 1 — Basic Information */}
      <div className="bg-surface-container-lowest rounded-xl p-5 space-y-4 border border-surface-container-highest">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={15} className="text-brand-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Basic Information
          </h3>
        </div>

        {/* Public Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Public Name <span className="text-feedback-error">*</span>
          </label>
          <Input
            variant="dark"
            type="text"
            value={formData.publicName}
            onChange={(e) => handlePublicNameChange(e.target.value)}
            placeholder="e.g., Summer Sale 2025"
            className={errors.publicName ? 'border-feedback-error/50' : ''}
          />
          {errors.publicName && (
            <p className="mt-1 text-xs text-feedback-error">
              {errors.publicName}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Customer-facing name displayed at checkout
          </p>
        </div>

        {/* Discount Code */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-900">
              Discount Code <span className="text-feedback-error">*</span>
            </label>
            {formData.code && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-semibold cursor-pointer hover:bg-brand-primary/20 transition-colors"
              >
                {codeCopied ? (
                  <>
                    <Check size={10} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    {formData.code}
                  </>
                )}
              </button>
            )}
          </div>
          <Input
            variant="dark"
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="e.g., SUMMER2025"
            className={errors.code ? 'border-feedback-error/50' : ''}
          />
          {errors.code && (
            <p className="mt-1 text-xs text-feedback-error">{errors.code}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Unique code customers will enter (auto-converted to uppercase)
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Description{' '}
            <span className="text-gray-500 font-normal">(Optional)</span>
          </label>
          <Textarea
            variant="dark"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Internal notes about this discount (not shown to customers)"
            rows={2}
          />
        </div>
      </div>

      {/* Section 2 — Discount Configuration */}
      <div className="bg-surface-container-lowest rounded-xl p-5 space-y-4 border border-surface-container-highest">
        <div className="flex items-center gap-2 mb-1">
          <Percent size={15} className="text-brand-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Discount Configuration
          </h3>
        </div>

        {/* Discount Type — visual card selector */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Discount Type <span className="text-feedback-error">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DISCOUNT_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isSelected = formData.discountType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, discountType: value })
                  }
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-surface-container-highest bg-surface-container text-gray-500 hover:border-brand-primary/40 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      isSelected ? 'text-brand-primary' : 'text-gray-500'
                    }
                  />
                  <span className="text-xs font-medium text-center leading-tight">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Discount Value */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Discount Value{' '}
            {!isFreeShipping && <span className="text-feedback-error">*</span>}
          </label>
          <Input
            variant="dark"
            type="number"
            step="0.01"
            min="0.01"
            max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
            value={formData.discountValue}
            disabled={isFreeShipping}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setFormData({
                ...formData,
                discountValue: isNaN(value) ? 0.01 : value,
              });
            }}
            className={errors.discountValue ? 'border-feedback-error/50' : ''}
          />
          {errors.discountValue && (
            <p className="mt-1 text-xs text-feedback-error">
              {errors.discountValue}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.discountType === 'PERCENTAGE' &&
              'Enter a percentage between 0 and 100'}
            {formData.discountType === 'FIXED_AMOUNT' &&
              'Enter a fixed dollar amount off'}
            {isFreeShipping && 'No value required for free shipping'}
          </p>
        </div>

        {/* Minimum Purchase */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Minimum Purchase Amount{' '}
            <span className="text-gray-500 font-normal">(Optional)</span>
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
          <p className="mt-1 text-xs text-gray-500">
            Minimum order value required to use this code
          </p>
        </div>
      </div>

      {/* Section 3 — Usage Limits */}
      <div className="bg-surface-container-lowest rounded-xl p-5 space-y-4 border border-surface-container-highest">
        <div className="flex items-center gap-2 mb-1">
          <Users size={15} className="text-brand-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Usage Limits</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
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
            <p className="mt-1 text-xs text-gray-500">
              Max times this code can be used
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
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
            <p className="mt-1 text-xs text-gray-500">
              Max uses per customer
            </p>
          </div>
        </div>
      </div>

      {/* Section 4 — Validity Period */}
      <div className="bg-surface-container-lowest rounded-xl p-5 space-y-4 border border-surface-container-highest">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={15} className="text-brand-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Validity Period
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Start Date{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={
                formData.startDate
                  ? new Date(formData.startDate).toISOString().split('T')[0]
                  : ''
              }
              className={dateInputClass}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  startDate: value
                    ? new Date(value + 'T00:00:00')
                    : undefined,
                });
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Defaults to now if empty
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              End Date{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={
                formData.endDate
                  ? new Date(formData.endDate).toISOString().split('T')[0]
                  : ''
              }
              className={`${dateInputClass} ${
                errors.endDate ? 'border-feedback-error/50' : ''
              }`}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  endDate: value
                    ? new Date(value + 'T23:59:59')
                    : undefined,
                });
              }}
            />
            {errors.endDate && (
              <p className="mt-1 text-xs text-feedback-error">
                {errors.endDate}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              No expiry if left empty
            </p>
          </div>
        </div>
      </div>

      {/* Section 5 — Status toggle */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-medium text-gray-900">Active</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Customers can use this discount code
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={formData.isActive}
          onClick={() =>
            setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
          }
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2 ${
            formData.isActive
              ? 'bg-brand-primary'
              : 'bg-surface-container-highest'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform duration-200 mt-0.5 ${
              formData.isActive ? 'translate-x-5' : 'translate-x-0.5'
            }`}
            style={{ backgroundColor: '#ffffff' }}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-container-highest">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-surface-container text-gray-900 rounded-lg hover:bg-surface-container-highest transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <Button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer"
        >
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
