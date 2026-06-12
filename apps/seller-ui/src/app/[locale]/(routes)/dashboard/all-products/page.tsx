/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Image as IKImage } from '@imagekit/next';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  BarChart2,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  useProducts,
  useDeleteProduct,
} from '../../../../../hooks/useProducts';
import { Alert } from '../../../../../components/ui/core/Alert';
import { Breadcrumb } from '../../../../../components/navigation/Breadcrumb';
import { DeleteConfirmationModal } from '../../../../../components/ui/modal/DeleteConfirmationModal';
import {
  imagekitConfig,
  getImageKitPath,
} from '../../../../../lib/imagekit-config';
import { Link, useRouter } from 'apps/seller-ui/src/i18n/navigation';

// --- Badge helpers ---

const stockBadgeClass = (stock: number) => {
  if (stock > 10)
    return 'bg-feedback-success/10 text-feedback-success border border-feedback-success/20';
  if (stock > 0)
    return 'bg-feedback-warning/10 text-feedback-warning border border-feedback-warning/20';
  return 'bg-feedback-error/10 text-feedback-error border border-feedback-error/20';
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return 'bg-feedback-success/10 text-feedback-success border border-feedback-success/20';
    case 'DRAFT':
      return 'bg-surface-container text-on-surface border border-outline-variant';
    default:
      return 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20';
  }
};

// --- Skeleton loader row ---

const SkeletonRow = () => (
  <tr className="border-b border-surface-container-highest">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-surface-container animate-pulse flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-3.5 bg-surface-container rounded animate-pulse w-32" />
          <div className="h-3 bg-surface-container rounded animate-pulse w-16" />
        </div>
      </div>
    </td>
    {[...Array(4)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-3.5 bg-surface-container rounded animate-pulse w-20" />
      </td>
    ))}
    <td className="px-6 py-4">
      <div className="flex justify-end gap-1">
        <div className="w-8 h-8 rounded-md bg-surface-container animate-pulse" />
        <div className="w-8 h-8 rounded-md bg-surface-container animate-pulse" />
      </div>
    </td>
  </tr>
);

// --- Page ---

const ProductsPage = () => {
  const t = useTranslations('AllProducts');
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: '',
  });

  const {
    data: products = [],
    isLoading: loading,
    error: fetchError,
  } = useProducts({ search: searchTerm || undefined });

  const { mutate: deleteProductMutation, isPending: isDeleting } =
    useDeleteProduct();

  const error = fetchError ? t('loadFailed') : null;

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const openDeleteModal = (productId: string, productName: string) => {
    setDeleteModal({ isOpen: true, productId, productName });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, productId: null, productName: '' });
  };

  const handleDeleteConfirm = () => {
    if (!deleteModal.productId) return;
    deleteProductMutation(deleteModal.productId, {
      onSuccess: () => closeDeleteModal(),
    });
  };

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q)
    );
  });

  const publishedCount = products.filter((p) => p.status === 'PUBLISHED').length;
  const draftCount = products.filter((p) => p.status === 'DRAFT').length;

  const tableHeaders = [
    { id: 'product', label: t('colProduct') },
    { id: 'price', label: t('colPrice') },
    { id: 'stock', label: t('colStock') },
    { id: 'status', label: t('colStatus') },
    { id: 'category', label: t('colCategory') },
    { id: 'actions', label: t('colActions') },
  ];

  const getStatusLabel = (status: string) => {
    if (status === 'PUBLISHED') return t('statusPublished');
    if (status === 'DRAFT') return t('statusDraft');
    return status;
  };

  return (
    <div className="w-full mx-auto p-8">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-semibold font-heading text-on-surface">
            {t('pageTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('pageSubtitle')}
          </p>
        </div>
        <Link
          href="/dashboard/create-product"
          className="px-4 py-2 bg-brand-primary-600 text-white rounded-lg text-sm font-medium hover:bg-brand-primary-700 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary-600/50"
        >
          <Plus size={16} />
          {t('addNew')}
        </Link>
      </div>

      <Breadcrumb
        items={[
          { label: t('breadcrumbDashboard'), href: '/dashboard' },
          { label: t('breadcrumbProducts') },
        ]}
      />

      {error && (
        <div className="mt-4">
          <Alert variant="error" title={t('errorTitle')} description={error} />
        </div>
      )}

      {/* Stats Row */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-md flex-shrink-0">
              <BarChart2 size={16} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                {t('statTotal')}
              </p>
              <p className="text-xl font-semibold text-on-surface font-heading">
                {products.length}
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 bg-feedback-success/10 rounded-md flex-shrink-0">
              <CheckCircle2 size={16} className="text-feedback-success" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                {t('statPublished')}
              </p>
              <p className="text-xl font-semibold text-on-surface font-heading">
                {publishedCount}
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-md flex-shrink-0">
              <FileText size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                {t('statDrafts')}
              </p>
              <p className="text-xl font-semibold text-on-surface font-heading">
                {draftCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 mb-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container text-sm rounded-md text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary-600/40 border border-transparent focus:border-brand-primary-600/30 transition-shadow"
          />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-surface-container-highest">
              <tr>
                {tableHeaders.map((h) => (
                  <th
                    key={h.id}
                    className={`px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                      h.id === 'actions' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-16 text-center">
          <div className="inline-flex p-4 bg-surface-container rounded-full mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-on-surface mb-1">
            {searchTerm ? t('emptySearchTitle') : t('emptyTitle')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
            {searchTerm
              ? t('emptySearchDesc', { term: searchTerm })
              : t('emptyDesc')}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/create-product"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary-600 text-white rounded-lg text-sm font-medium hover:bg-brand-primary-700 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              {t('addFirst')}
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low border-b border-surface-container-highest">
                <tr>
                  {tableHeaders.map((h) => (
                    <th
                      key={h.id}
                      className={`px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                        h.id === 'actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-surface-container-low transition-colors duration-150"
                  >
                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images && product.images[0] ? (
                          <div
                            className="relative w-10 h-10 rounded-md overflow-hidden cursor-pointer ring-1 ring-outline-variant hover:ring-2 hover:ring-brand-primary-600/50 transition-all flex-shrink-0"
                            onMouseEnter={() =>
                              setHoveredImage(product.images[0])
                            }
                            onMouseLeave={() => setHoveredImage(null)}
                            onMouseMove={handleMouseMove}
                          >
                            {imagekitConfig.urlEndpoint ? (
                              <IKImage
                                urlEndpoint={imagekitConfig.urlEndpoint}
                                src={getImageKitPath(product.images[0])}
                                alt={product.name}
                                width={40}
                                height={40}
                                transformation={[
                                  {
                                    width: '40',
                                    height: '40',
                                    crop: 'at_max',
                                    quality: 80,
                                  },
                                ]}
                                loading="lazy"
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="object-cover w-full h-full"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-surface-container flex items-center justify-center flex-shrink-0 ring-1 ring-outline-variant">
                            <Package size={18} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">
                            {product.productType}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-on-surface">
                        ${product.salePrice || product.price}
                      </span>
                      {product.salePrice && (
                        <span className="ml-2 text-xs text-gray-400 line-through">
                          ${product.price}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${stockBadgeClass(product.stock)}`}
                      >
                        {t('stockUnits', { count: product.stock })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${statusBadgeClass(product.status)}`}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20">
                        {product.category?.name || t('uncategorized')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/products/edit/${product.id}`
                            )
                          }
                          aria-label={t('editProduct', { name: product.name })}
                          className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            openDeleteModal(product.id, product.name)
                          }
                          aria-label={t('deleteProduct', { name: product.name })}
                          className="p-2 text-gray-400 hover:text-feedback-error hover:bg-feedback-error/10 rounded-md transition-colors cursor-pointer"
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

          {/* Table Footer */}
          <div className="px-6 py-3 bg-surface-container-low border-t border-surface-container-highest flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {t('showingProducts', {
                shown: filteredProducts.length,
                total: products.length,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Image Hover Preview */}
      {hoveredImage && (
        <div
          className="fixed z-[9999] pointer-events-none animate-fade-in-zoom"
          style={{
            left: `${mousePosition.x - 276}px`,
            top: `${mousePosition.y - 128}px`,
          }}
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-black/10 dark:bg-black/40 rounded-xl blur-md" />
            <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-elev-lg overflow-hidden w-56 h-56">
              {imagekitConfig.urlEndpoint ? (
                <IKImage
                  urlEndpoint={imagekitConfig.urlEndpoint}
                  src={getImageKitPath(hoveredImage)}
                  alt="Product preview"
                  width={224}
                  height={224}
                  transformation={[
                    {
                      width: '224',
                      height: '224',
                      crop: 'at_max',
                      quality: 90,
                      focus: 'auto',
                    },
                  ]}
                  loading="eager"
                  className="object-cover w-full h-full"
                />
              ) : (
                <img
                  src={hoveredImage ?? ''}
                  alt="Product preview"
                  className="object-cover w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        productName={deleteModal.productName}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ProductsPage;
