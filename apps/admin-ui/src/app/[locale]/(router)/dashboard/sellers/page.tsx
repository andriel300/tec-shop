'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import {
  useSellers,
  useUpdateSellerVerification,
} from '../../../../../hooks/useAdminData';
import type { SellerWithShopResponse } from '../../../../../lib/api/admin';
import {
  exportToCSV,
  sellerColumns,
} from '../../../../../lib/utils/csv-export';

// Verification Confirmation Modal
const VerificationModal = ({
  isOpen,
  onClose,
  onConfirm,
  sellerName,
  currentStatus,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  sellerName: string;
  currentStatus: boolean;
  isPending: boolean;
}) => {
  const t = useTranslations('Sellers');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const newStatus = !currentStatus;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-xl font-semibold mb-4">
          {newStatus ? t('modalTitleVerify') : t('modalTitleUnverify')}
        </h3>
        <p className="text-slate-300 mb-4">
          {t.rich(newStatus ? 'modalConfirmVerify' : 'modalConfirmUnverify', {
            name: sellerName,
            bold: (chunks) => (
              <span className="font-semibold text-white">{chunks}</span>
            ),
          })}
        </p>

        <div className="mb-4">
          <label className="text-slate-300 text-sm block mb-2">
            {t('modalNoteLabel')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
            rows={3}
            placeholder={
              newStatus
                ? t('modalNotePlaceholderVerify')
                : t('modalNotePlaceholderUnverify')
            }
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onConfirm(note || undefined);
              setNote('');
            }}
            disabled={isPending}
            className={`flex-1 ${
              newStatus
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            } text-white rounded p-3 font-medium disabled:opacity-50`}
          >
            {isPending
              ? t('modalProcessing')
              : newStatus
              ? t('modalBtnVerify')
              : t('modalBtnUnverify')}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {t('modalCancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Avatar component
const SellerAvatar = ({ name, image }: { name: string; image?: string }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
      {initials}
    </div>
  );
};

const SellersPage = () => {
  const t = useTranslations('Sellers');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<
    'all' | 'verified' | 'unverified'
  >('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] =
    useState<SellerWithShopResponse | null>(null);

  const apiParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      search?: string;
      isVerified?: boolean;
    } = { page, limit };
    if (search) params.search = search;
    if (verificationFilter === 'verified') params.isVerified = true;
    if (verificationFilter === 'unverified') params.isVerified = false;
    return params;
  }, [page, limit, search, verificationFilter]);

  const { data, isLoading, error } = useSellers(apiParams);
  const updateVerificationMutation = useUpdateSellerVerification();

  const openVerificationModal = (seller: SellerWithShopResponse) => {
    setSelectedSeller(seller);
    setModalOpen(true);
  };

  const confirmVerification = (note?: string) => {
    if (!selectedSeller) return;
    updateVerificationMutation.mutate(
      {
        sellerId: selectedSeller.id,
        data: { isVerified: !selectedSeller.isVerified, note },
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setSelectedSeller(null);
        },
      }
    );
  };

  const handleExport = () => {
    if (!data?.data?.length) return;
    exportToCSV(
      data.data as unknown as Record<string, unknown>[],
      sellerColumns,
      `sellers-export-${new Date().toISOString().split('T')[0]}`
    );
  };

  const columns: ColumnDef<SellerWithShopResponse>[] = [
    {
      header: t('colSeller'),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <SellerAvatar name={row.original.name} />
          <div>
            <div className="text-white font-medium">{row.original.name}</div>
            <div className="text-slate-400 text-xs">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: t('colShop'),
      accessorKey: 'shop',
      cell: ({ row }) => {
        const shop = row.original.shop;
        if (!shop) {
          return <span className="text-slate-500 italic">{t('noShop')}</span>;
        }
        return (
          <div>
            <div className="text-white font-medium">{shop.businessName}</div>
            <div className="text-slate-400 text-xs">
              {shop.category || t('noCategory')}
            </div>
          </div>
        );
      },
    },
    {
      header: t('colCountry'),
      accessorKey: 'country',
      cell: ({ getValue }) => (
        <span className="text-slate-300">{(getValue() as string) || '-'}</span>
      ),
    },
    {
      header: t('colVerification'),
      accessorKey: 'isVerified',
      cell: ({ row }) => {
        const isVerified = row.original.isVerified;
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              isVerified
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
            }`}
          >
            {isVerified ? t('badgeVerified') : t('badgePending')}
          </span>
        );
      },
    },
    {
      header: t('colShopStatus'),
      cell: ({ row }) => {
        const shop = row.original.shop;
        if (!shop) return <span className="text-slate-500">-</span>;
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              shop.isActive
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
            }`}
          >
            {shop.isActive ? t('badgeActive') : t('badgeInactive')}
          </span>
        );
      },
    },
    {
      header: t('colJoined'),
      accessorKey: 'createdAt',
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString(),
    },
    {
      header: t('colActions'),
      cell: ({ row }) => {
        const seller = row.original;
        return (
          <button
            onClick={() => openVerificationModal(seller)}
            disabled={updateVerificationMutation.isPending}
            className={`px-3 py-1 rounded text-sm font-medium disabled:opacity-50 transition-colors ${
              seller.isVerified
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {seller.isVerified ? t('actionUnverify') : t('actionVerify')}
          </button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const stats = useMemo(() => {
    const sellers = data?.data || [];
    return {
      total: data?.pagination?.total || 0,
      verified: sellers.filter((s) => s.isVerified).length,
      pending: sellers.filter((s) => !s.isVerified).length,
      withShop: sellers.filter((s) => s.shop).length,
    };
  }, [data]);

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-white text-3xl font-semibold">
            {t('pageTitle')}
          </h1>
          <p className="text-slate-400 mt-1">{t('pageSubtitle')}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!data?.data?.length}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {t('exportCsv')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">{t('statTotalSellers')}</div>
          <div className="text-white text-2xl font-semibold mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">{t('statVerified')}</div>
          <div className="text-green-400 text-2xl font-semibold mt-1">
            {stats.verified}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">{t('statPendingVerification')}</div>
          <div className="text-yellow-400 text-2xl font-semibold mt-1">
            {stats.pending}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">{t('statWithActiveShop')}</div>
          <div className="text-blue-400 text-2xl font-semibold mt-1">
            {stats.withShop}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
          />

          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(
                e.target.value as typeof verificationFilter
              );
              setPage(1);
            }}
            className="bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">{t('filterAllStatuses')}</option>
            <option value="verified">{t('filterVerifiedOnly')}</option>
            <option value="unverified">{t('filterPendingVerification')}</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setVerificationFilter('all');
              setPage(1);
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded p-3 transition-colors"
          >
            {t('clearFilters')}
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-slate-400">{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center border border-red-700">
          <p className="text-red-400">{t('errorLoading', { message: error.message })}</p>
        </div>
      ) : !data?.data?.length ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
          <p className="text-slate-400">{t('noSellers')}</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg shadow-xl overflow-hidden border border-slate-700">
            <table className="min-w-full text-sm text-white">
              <thead className="bg-slate-900 text-slate-300">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-3 text-left font-medium">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-transparent">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-700 hover:bg-slate-800/50 transition"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-slate-400">
                {t('paginationShowing', {
                  count: data.data.length,
                  total: data.pagination.total,
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  {t('prevPage')}
                </button>
                <span className="text-white px-4 py-2">
                  {t('paginationPage', {
                    page,
                    totalPages: data.pagination.totalPages,
                  })}
                </span>
                <button
                  onClick={() =>
                    setPage(Math.min(data.pagination.totalPages, page + 1))
                  }
                  disabled={page === data.pagination.totalPages}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  {t('nextPage')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Verification Modal */}
      <VerificationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSeller(null);
        }}
        onConfirm={confirmVerification}
        sellerName={selectedSeller?.name || ''}
        currentStatus={selectedSeller?.isVerified || false}
        isPending={updateVerificationMutation.isPending}
      />
    </div>
  );
};

export default SellersPage;
