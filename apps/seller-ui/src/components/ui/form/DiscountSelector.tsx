'use client';

import React from 'react';
import { Ticket, ExternalLink, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';
import { useDiscounts } from '../../../hooks/useDiscounts';
import { Select } from '../core/Select';

interface DiscountSelectorProps {
  value?: string;
  onChange: (discountId: string | undefined) => void;
}

export function DiscountSelector({ value, onChange }: DiscountSelectorProps) {
  const t = useTranslations('CreateProduct');
  const { data: discounts, isLoading, error } = useDiscounts();

  const activeDiscounts = discounts?.filter((d) => d.isActive) || [];

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('discountTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
          <span>{t('discountLoading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('discountTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{t('discountLoadFailed')}</span>
        </div>
      </div>
    );
  }

  if (activeDiscounts.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('discountTitle')}
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
                {t('discountNoneAvailable')}
              </p>
              <p className="text-gray-500 text-sm mb-3">
                {t('discountCreateDesc')}
              </p>
              <Link
                href="/dashboard/discount-codes"
                className="inline-flex items-center gap-2 text-brand-primary-600 hover:text-brand-primary-700 text-sm font-medium transition-colors"
              >
                {t('discountCreateLink')}
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const discountOptions = [
    { value: '', label: t('discountNoCode') },
    ...activeDiscounts.map((discount) => ({
      value: discount.id,
      label: `${discount.code} - ${discount.publicName} (${
        discount.discountType === 'PERCENTAGE'
          ? t('discountPctOff', { value: discount.discountValue })
          : discount.discountType === 'FIXED_AMOUNT'
          ? t('discountFixedOff', { amount: discount.discountValue })
          : t('discountFreeShipping')
      })`,
    })),
  ];

  return (
    <div className="bg-surface-container-lowest border border-surface-container-highest shadow-ambient rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={20} className="text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('discountTitle')}
          </h3>
        </div>
        <Link
          href="/dashboard/discount-codes"
          className="inline-flex items-center gap-1 text-sm text-brand-primary-600 hover:text-brand-primary-700 transition-colors"
        >
          {t('discountManageCodes')}
          <ExternalLink size={14} />
        </Link>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {t('discountSelectLabel')}
        </label>
        <Select
          value={value || ''}
          onChange={(selectedValue) => {
            onChange(selectedValue === '' ? undefined : selectedValue);
          }}
          options={discountOptions}
          variant="dark"
        />
        <p className="mt-2 text-sm text-gray-500">
          {t('discountAttachDesc')}
        </p>

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
                    <span className="text-gray-500">{t('discountDetailCode')}</span>
                    <code className="text-brand-primary bg-brand-primary/15 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                      {selectedDiscount.code}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{t('discountDetailType')}</span>
                    <span className="text-gray-900">
                      {selectedDiscount.discountType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{t('discountDetailValue')}</span>
                    <span className="text-brand-primary font-semibold">
                      {selectedDiscount.discountType === 'PERCENTAGE'
                        ? `${selectedDiscount.discountValue}%`
                        : selectedDiscount.discountType === 'FIXED_AMOUNT'
                        ? `$${selectedDiscount.discountValue}`
                        : t('discountFreeShipping')}
                    </span>
                  </div>
                  {selectedDiscount.usageLimit && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{t('discountDetailUsage')}</span>
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
        {t.rich('discountNote', {
          bold: (chunks) => <strong>{chunks}</strong>,
        })}
      </div>
    </div>
  );
}
