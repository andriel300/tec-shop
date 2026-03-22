import React from 'react';
import { Ticket, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from '../../../i18n/navigation';
import { useDiscounts } from '../../../hooks/useDiscounts';
import { Select } from '../core/Select';

interface DiscountSelectorProps {
  value?: string; // Selected discount code ID
  onChange: (discountId: string | undefined) => void;
}

/**
 * Discount Code Selector Component
 *
 * Allows sellers to attach a discount code to a product
 * Features:
 * - Fetches active discount codes from the backend
 * - Shows helpful message if no codes exist
 * - Provides quick link to create discount codes
 * - Only shows active discount codes
 */
export function DiscountSelector({ value, onChange }: DiscountSelectorProps) {
  const { data: discounts, isLoading, error } = useDiscounts();

  // Filter only active discounts
  const activeDiscounts = discounts?.filter((d) => d.isActive) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            Discount Code (Optional)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
          <span>Loading discount codes...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            Discount Code (Optional)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">Failed to load discount codes</span>
        </div>
      </div>
    );
  }

  // No active discounts
  if (activeDiscounts.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            Discount Code (Optional)
          </h3>
        </div>
        <div className="bg-brand-primary-600/10 border border-brand-primary-600/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-brand-primary-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-brand-primary-600 text-sm font-medium mb-1">
                No active discount codes available
              </p>
              <p className="text-gray-500 text-sm mb-3">
                Create discount codes to offer special pricing, promotions, or
                seasonal sales to your customers.
              </p>
              <Link
                href="/dashboard/discount-codes"
                className="inline-flex items-center gap-2 text-brand-primary-600 hover:text-brand-primary-700 text-sm font-medium transition-colors"
              >
                Create Discount Code
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create options for Select component
  const discountOptions = [
    { value: '', label: 'No discount code' },
    ...activeDiscounts.map((discount) => ({
      value: discount.id,
      label: `${discount.code} - ${discount.publicName} (${discount.discountType === 'PERCENTAGE'
        ? `${discount.discountValue}% off`
        : discount.discountType === 'FIXED_AMOUNT'
          ? `$${discount.discountValue} off`
          : 'Free Shipping'
        })`,
    })),
  ];

  return (
    <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            Discount Code (Optional)
          </h3>
        </div>
        <Link
          href="/dashboard/discount-codes"
          className="inline-flex items-center gap-1 text-sm text-brand-primary-600 hover:text-brand-primary-700 transition-colors"
        >
          Manage Codes
          <ExternalLink size={14} />
        </Link>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Select Discount Code
        </label>
        <Select
          value={value || ''}
          onChange={(selectedValue) => {
            // If empty string, pass undefined to remove discount
            onChange(selectedValue === '' ? undefined : selectedValue);
          }}
          options={discountOptions}
          variant="dark"
        />
        <p className="mt-2 text-sm text-gray-500">
          Attach a discount code to this product. Customers can apply this code
          at checkout to receive the discount.
        </p>

        {/* Show selected discount details */}
        {value && activeDiscounts.find((d) => d.id === value) && (
          <div className="mt-3 bg-brand-primary/10 rounded-lg p-3">
            {(() => {
              const selectedDiscount = activeDiscounts.find(
                (d) => d.id === value
              );
              if (!selectedDiscount) return null;

              return (
                <div className="text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Code:</span>
                    <code className="text-brand-primary bg-brand-primary/15 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                      {selectedDiscount.code}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="text-gray-900">
                      {selectedDiscount.discountType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Value:</span>
                    <span className="text-brand-primary font-semibold">
                      {selectedDiscount.discountType === 'PERCENTAGE'
                        ? `${selectedDiscount.discountValue}%`
                        : selectedDiscount.discountType === 'FIXED_AMOUNT'
                          ? `$${selectedDiscount.discountValue}`
                          : 'Free Shipping'}
                    </span>
                  </div>
                  {selectedDiscount.usageLimit && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Usage:</span>
                      <span className="text-gray-900">
                        {selectedDiscount.usageCount} /{' '}
                        {selectedDiscount.usageLimit}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 border-t border-surface-container-highest pt-3">
        <strong>Note:</strong> Only active discount codes are shown. Inactive or
        expired codes will not appear in this list.
      </div>
    </div>
  );
}
