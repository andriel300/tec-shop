import React from 'react';
import { Ticket, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useDiscounts } from '../../../../hooks/useDiscounts';
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
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-200">
            Discount Code (Optional)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
          <span>Loading discount codes...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-200">
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
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-200">
            Discount Code (Optional)
          </h3>
        </div>
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-blue-400 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">
                No active discount codes available
              </p>
              <p className="text-gray-400 text-sm mb-3">
                Create discount codes to offer special pricing, promotions, or
                seasonal sales to your customers.
              </p>
              <Link
                href="/dashboard/discount-codes"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
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
      label: `${discount.code} - ${discount.publicName} (${
        discount.discountType === 'PERCENTAGE'
          ? `${discount.discountValue}% off`
          : discount.discountType === 'FIXED_AMOUNT'
          ? `$${discount.discountValue} off`
          : 'Free Shipping'
      })`,
    })),
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={20} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-200">
            Discount Code (Optional)
          </h3>
        </div>
        <Link
          href="/dashboard/discount-codes"
          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Manage Codes
          <ExternalLink size={14} />
        </Link>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
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
        <p className="mt-2 text-sm text-gray-400">
          Attach a discount code to this product. Customers can apply this code
          at checkout to receive the discount.
        </p>

        {/* Show selected discount details */}
        {value && activeDiscounts.find((d) => d.id === value) && (
          <div className="mt-3 bg-purple-900/20 border border-purple-700 rounded-lg p-3">
            {(() => {
              const selectedDiscount = activeDiscounts.find(
                (d) => d.id === value
              );
              if (!selectedDiscount) return null;

              return (
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Code:</span>
                    <code className="text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded">
                      {selectedDiscount.code}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-gray-300">
                      {selectedDiscount.discountType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Value:</span>
                    <span className="text-purple-300 font-medium">
                      {selectedDiscount.discountType === 'PERCENTAGE'
                        ? `${selectedDiscount.discountValue}%`
                        : selectedDiscount.discountType === 'FIXED_AMOUNT'
                        ? `$${selectedDiscount.discountValue}`
                        : 'Free Shipping'}
                    </span>
                  </div>
                  {selectedDiscount.usageLimit && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Usage:</span>
                      <span className="text-gray-300">
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

      <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
        <strong>Note:</strong> Only active discount codes are shown. Inactive or
        expired codes will not appear in this list.
      </div>
    </div>
  );
}
