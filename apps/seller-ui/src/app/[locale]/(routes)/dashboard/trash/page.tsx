'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useDeletedProducts,
  useRestoreProduct,
} from '../../../../../hooks/useProducts';
import {
  Search,
  RotateCcw,
  Clock,
  AlertCircle,
  Trash2,
  PackageOpen,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import type { ProductResponse } from '../../../../../lib/api/products';
import { Breadcrumb } from '../../../../../components/navigation/Breadcrumb';

const TrashPage = () => {
  const t = useTranslations('Trash');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data: deletedProducts,
    isLoading,
    isError,
  } = useDeletedProducts({
    search: searchQuery || undefined,
  });
  const { mutate: restoreProductMutation, isPending: isRestoring } =
    useRestoreProduct();

  const handleRestore = (productId: string) => {
    restoreProductMutation(productId);
  };

  const getTimeRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(
      deletedDate.getTime() + 24 * 60 * 60 * 1000
    );
    const now = new Date();
    const remainingMs = expiryDate.getTime() - now.getTime();

    if (remainingMs <= 0) return { label: t('expiringSoon'), urgent: true };

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor(
      (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    if (hours > 0) {
      return {
        label: t('timeRemaining', { hours, minutes }),
        urgent: hours < 3,
      };
    }
    return { label: t('minutesRemaining', { minutes }), urgent: true };
  };

  const productCount = deletedProducts?.length ?? 0;

  return (
    <div className="w-full p-8 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-feedback-error/10 rounded-lg">
            <Trash2 size={20} className="text-feedback-error" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('pageTitle')}</h1>
          {productCount > 0 && (
            <span className="px-2.5 py-0.5 bg-feedback-error/10 text-feedback-error text-xs font-semibold rounded-full">
              {productCount}
            </span>
          )}
        </div>
        <Breadcrumb
          items={[
            { label: t('breadcrumbDashboard'), href: '/dashboard' },
            { label: t('breadcrumbTrash') },
          ]}
        />
      </div>

      <div className="flex items-start gap-3 p-4 bg-feedback-warning/10 border border-feedback-warning/30 rounded-xl">
        <AlertTriangle
          size={18}
          className="text-feedback-warning flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {t('warningTitle')}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('warningDesc')}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-surface-container-highest rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-colors text-sm"
        />
      </div>

      {isLoading && (
        <div className="bg-surface-container-lowest rounded-xl p-16 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-surface-container-highest border-t-brand-primary rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{t('loading')}</p>
        </div>
      )}

      {isError && (
        <div className="bg-surface-container-lowest rounded-xl p-12 flex flex-col items-center gap-3 text-center">
          <div className="p-4 bg-feedback-error/10 rounded-full">
            <AlertCircle size={28} className="text-feedback-error" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {t('errorTitle')}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {t('errorDesc')}
          </p>
        </div>
      )}

      {!isLoading && !isError && productCount === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-16 flex flex-col items-center gap-3 text-center">
          <div className="p-5 bg-surface-container rounded-full">
            <PackageOpen size={32} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t('emptyTitle')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? t('emptySearchDesc') : t('emptyDesc')}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && productCount > 0 && (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('sectionTitle')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('sectionSubtitle', { count: productCount })}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('colProduct')}
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('colCategory')}
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('colPrice')}
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('colDeleted')}
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('colExpiresIn')}
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('colActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest">
                {deletedProducts!.map((product: ProductResponse) => {
                  const timeInfo = getTimeRemaining(product.deletedAt!);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-surface-container transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover opacity-60"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PackageOpen
                                  size={16}
                                  className="text-gray-500"
                                />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-feedback-error/10" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">
                                {product.description.replace(/<[^>]*>/g, '').substring(0, 50)}
                                ...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-surface-container text-gray-900">
                          {product.category?.name || t('uncategorized')}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          ${product.price.toFixed(2)}
                        </p>
                        {product.salePrice && (
                          <p className="text-xs text-gray-500 line-through mt-0.5">
                            ${product.salePrice.toFixed(2)}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900">
                          {new Date(product.deletedAt!).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(product.deletedAt!).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            size={13}
                            className={
                              timeInfo.urgent
                                ? 'text-feedback-error'
                                : 'text-feedback-warning'
                            }
                          />
                          <span
                            className={`text-xs font-medium ${
                              timeInfo.urgent
                                ? 'text-feedback-error'
                                : 'text-feedback-warning'
                            }`}
                          >
                            {timeInfo.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleRestore(product.id)}
                          disabled={isRestoring}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-feedback-success/10 hover:bg-feedback-success/20 text-feedback-success rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-feedback-success/30 text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw
                            size={13}
                            className={isRestoring ? 'animate-spin' : ''}
                          />
                          {t('restore')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-surface-container-highest">
            <p className="text-xs text-gray-500">
              {t('footerDesc', { count: productCount })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashPage;
