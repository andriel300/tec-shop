'use client';

import { useTranslations } from 'next-intl';
import { Breadcrumb } from '../../../../../components/navigation/Breadcrumb';
import { Button } from '../../../../../components/ui/core/Button';
import { Modal } from '../../../../../components/ui/core/Modal';
import { DiscountForm } from '../../../../../components/forms/DiscountForm';
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import {
  useDiscounts,
  useDeleteDiscount,
  useCreateDiscount,
  useUpdateDiscount,
} from '../../../../../hooks/useDiscounts';
import type {
  DiscountResponse,
  CreateDiscountData,
} from '../../../../../lib/api/discounts';
import { toast } from 'sonner';

const Page = () => {
  const t = useTranslations('DiscountCodes');
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] =
    useState<DiscountResponse | null>(null);

  const { data: discounts, isLoading, error } = useDiscounts();
  const deleteMutation = useDeleteDiscount();
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount(editingDiscount?.id || '');

  const handleSubmitDiscount = (data: CreateDiscountData) => {
    if (editingDiscount) {
      updateMutation.mutate(data, {
        onSuccess: () => {
          setShowModal(false);
          setEditingDiscount(null);
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setShowModal(false);
        },
      });
    }
  };

  const handleCreateClick = () => {
    setEditingDiscount(null);
    setShowModal(true);
  };

  const handleEditClick = (discount: DiscountResponse) => {
    setEditingDiscount(discount);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('copiedSuccess'), { description: code });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t('validUntilNa');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDiscountValue = (discount: DiscountResponse) => {
    switch (discount.discountType) {
      case 'PERCENTAGE':
        return `${discount.discountValue}%`;
      case 'FIXED_AMOUNT':
        return `$${discount.discountValue}`;
      case 'FREE_SHIPPING':
        return t('freeShipping');
      default:
        return discount.discountValue;
    }
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-gray-900 font-semibold">{t('pageTitle')}</h2>
        <Button
          className="px-4 py-2 gap-2 items-center"
          onClick={handleCreateClick}
        >
          <Plus size={18} /> {t('createBtn')}
        </Button>
      </div>
      <div className="flex items-center text-gray-900">
        <Breadcrumb
          items={[
            { label: t('breadcrumbDashboard'), href: '/dashboard' },
            { label: t('breadcrumbDiscountCodes') },
          ]}
        />
      </div>

      <div className="mt-8 bg-[#ffffff] dark:bg-slate-900 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('sectionTitle')}
        </h3>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-400">{t('loading')}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">{t('loadFailed')}</p>
            <p className="text-sm text-gray-400 mt-1">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && discounts?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {t('emptyTitle')}
            </h3>
            <p className="text-gray-500 mb-4">{t('emptyDesc')}</p>
            <Button onClick={handleCreateClick}>
              <Plus size={18} className="mr-2" /> {t('emptyCreateBtn')}
            </Button>
          </div>
        )}

        {!isLoading && !error && discounts && discounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {t('colCode')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {t('colName')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {t('colType')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {t('colValue')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {t('colUsage')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {t('colValidUntil')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {t('colStatus')}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    {t('colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr
                    key={discount.id}
                    className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-blue-400 font-mono bg-blue-900/20 px-2 py-1 rounded">
                          {discount.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(discount.code)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title={t('copyTitle')}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {discount.publicName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {discount.discountType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {formatDiscountValue(discount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 dark:text-gray-300">
                        {discount.usageCount}
                        {discount.usageLimit ? ` / ${discount.usageLimit}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {formatDate(discount.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {discount.isActive ? (
                          <Eye size={16} className="text-green-400" />
                        ) : (
                          <EyeOff size={16} className="text-gray-500" />
                        )}
                        <span
                          className={
                            discount.isActive
                              ? 'text-green-400'
                              : 'text-gray-500'
                          }
                        >
                          {discount.isActive ? t('statusActive') : t('statusInactive')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(discount)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                          title={t('editTitle')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('deleteConfirm'))) {
                              deleteMutation.mutate(discount.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                          title={t('deleteTitle')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingDiscount ? t('modalEditTitle') : t('modalCreateTitle')}
        size="lg"
      >
        <DiscountForm
          onSubmit={handleSubmitDiscount}
          onCancel={handleCloseModal}
          isLoading={
            editingDiscount
              ? updateMutation.isPending
              : createMutation.isPending
          }
          initialData={
            editingDiscount
              ? {
                  publicName: editingDiscount.publicName,
                  code: editingDiscount.code,
                  description: editingDiscount.description ?? undefined,
                  discountType: editingDiscount.discountType,
                  discountValue: editingDiscount.discountValue,
                  usageLimit: editingDiscount.usageLimit ?? undefined,
                  minimumPurchase: editingDiscount.minimumPurchase ?? undefined,
                  maxUsesPerCustomer:
                    editingDiscount.maxUsesPerCustomer ?? undefined,
                  startDate: new Date(editingDiscount.startDate),
                  endDate: editingDiscount.endDate
                    ? new Date(editingDiscount.endDate)
                    : undefined,
                  isActive: editingDiscount.isActive,
                }
              : undefined
          }
        />
      </Modal>
    </div>
  );
};

export default Page;
