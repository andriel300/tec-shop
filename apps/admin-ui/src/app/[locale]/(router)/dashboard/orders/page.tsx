/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { Row } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  Clock,
  Download,
  Calendar,
} from 'lucide-react';
import apiClient from '../../../../../lib/api/client';
import { exportToCSV } from '../../../../../lib/utils/csv-export';
import { Link } from 'apps/admin-ui/src/i18n/navigation';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sellerPayout: number;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  subtotalAmount: number;
  finalAmount: number;
  items: OrderItem[];
  createdAt: string;
  shop?: { name: string };
  user?: { name: string };
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-cyan-500',
];

const getAvatarColor = (str: string) =>
  AVATAR_COLORS[
    str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      AVATAR_COLORS.length
  ];

const getInitials = (name?: string, fallback?: string) => {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return fallback ? fallback.slice(0, 2).toUpperCase() : '??';
};

const getPageNumbers = (
  current: number,
  total: number
): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '...')[] = [0];
  if (current > 2) pages.push('...');
  for (
    let i = Math.max(1, current - 1);
    i <= Math.min(total - 2, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 3) pages.push('...');
  pages.push(total - 1);
  return pages;
};

const STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  PENDING:   { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'PENDING'   },
  PAID:      { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'PAID'      },
  SHIPPED:   { dot: 'bg-blue-400',    text: 'text-blue-400',    label: 'SHIPPED'   },
  DELIVERED: { dot: 'bg-purple-400',  text: 'text-purple-400',  label: 'DELIVERED' },
  CANCELLED: { dot: 'bg-red-400',     text: 'text-red-400',     label: 'CANCELLED' },
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING:   'text-amber-400',
  COMPLETED: 'text-emerald-400',
  FAILED:    'text-red-400',
  REFUNDED:  'text-orange-400',
};

const fetchOrders = async () => {
  const res = await apiClient.get('/admin/orders');
  return res.data;
};

const OrdersPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5,
  });

  const orders = (data?.data as Order[]) ?? [];
  const pagination = data?.pagination;

  const totalOrders = pagination?.total ?? orders.length;
  const totalPayouts = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.sellerPayout, 0),
    0
  );
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Order',
        cell: ({ row }: { row: { original: Order } }) => (
          <div>
            <span className="font-mono text-sm font-semibold text-white">
              #{row.original.id.slice(-6).toUpperCase()}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(row.original.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'user.name',
        header: 'Buyer',
        cell: ({ row }: { row: Row<Order> }) => {
          const name = row.original.user?.name;
          const initials = getInitials(name, row.original.userId);
          const color = getAvatarColor(row.original.userId);
          return (
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}
              >
                <span className="text-white text-xs font-semibold">
                  {initials}
                </span>
              </div>
              <span className="text-sm text-white font-medium">
                {name ?? `User ${row.original.userId.slice(0, 8)}`}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'shop.name',
        header: 'Shop',
        cell: ({ row }: { row: Row<Order> }) => (
          <span className="text-sm text-gray-300">
            {row.original.shop?.name ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'items',
        header: 'Product(s)',
        cell: ({ row }: { row: { original: Order } }) => {
          const items = row.original.items.slice(0, 2);
          const overflow = row.original.items.length - 2;
          return (
            <div className="flex items-center gap-1">
              {items.map((item, i) => (
                <div
                  key={i}
                  title={item.productName}
                  className="w-9 h-9 rounded-md bg-gray-800 border border-gray-700
                             flex items-center justify-center text-xs font-bold
                             text-gray-400 shrink-0"
                >
                  {item.productName.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {overflow > 0 && (
                <div
                  className="w-9 h-9 rounded-md bg-gray-800 flex items-center
                               justify-center text-xs font-semibold text-gray-500 shrink-0"
                >
                  +{overflow}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'finalAmount',
        header: 'Total',
        cell: ({ row }: { row: { original: Order } }) => (
          <span className="text-sm font-semibold text-white">
            $
            {((row.original.finalAmount ?? 0) / 100).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: { original: Order } }) => {
          const cfg = STATUS_CONFIG[row.original.status] ?? {
            dot: 'bg-gray-400',
            text: 'text-gray-400',
            label: row.original.status,
          };
          return (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
              <span
                className={`text-xs font-semibold tracking-wide ${cfg.text}`}
              >
                {cfg.label}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }: { row: { original: Order } }) => (
          <span
            className={`text-xs font-semibold ${
              PAYMENT_COLORS[row.original.paymentStatus] ?? 'text-gray-400'
            }`}
          >
            {row.original.paymentStatus}
          </span>
        ),
      },
      {
        header: 'Actions',
        cell: ({ row }: { row: { original: Order } }) => (
          <Link
            href={`/dashboard/order/${row.original.id}`}
            className="text-sm font-medium text-brand-primary-400
                       hover:text-brand-primary-300 transition-colors whitespace-nowrap"
          >
            View Details
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 10 } },
  });

  const currentPage = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const filteredTotal = table.getFilteredRowModel().rows.length;
  const pageStart = currentPage * table.getState().pagination.pageSize + 1;
  const pageEnd = Math.min(
    (currentPage + 1) * table.getState().pagination.pageSize,
    filteredTotal
  );

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-300 font-medium">Orders</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Orders Management</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Orders */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-brand-primary-600/10 p-2.5 rounded-lg">
                <Package size={18} className="text-brand-primary-400" />
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-0.5 rounded-full">
                All Time
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-white">
              {totalOrders.toLocaleString()}
            </p>
          </div>
          <Package
            size={110}
            className="absolute -bottom-5 -right-5 text-brand-primary-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Total Payouts */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                <DollarSign size={18} className="text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-0.5 rounded-full">
                Seller Payouts
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Payouts</p>
            <p className="text-3xl font-bold text-white">
              $
              {(totalPayouts / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <DollarSign
            size={110}
            className="absolute -bottom-5 -right-5 text-emerald-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Pending */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-lg">
                <Clock size={18} className="text-amber-400" />
              </div>
              {pendingCount > 0 && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Action Needed
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">Pending Orders</p>
            <p className="text-3xl font-bold text-white">{pendingCount}</p>
          </div>
          <Clock
            size={110}
            className="absolute -bottom-5 -right-5 text-amber-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {/* Filters Header */}
        <div className="px-6 py-4 flex flex-col md:flex-row gap-3 border-b border-gray-800">
          <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2.5">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by buyer, shop, or order ID..."
              className="w-full bg-transparent text-white outline-none placeholder:text-gray-500 text-sm"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              className="bg-gray-800 text-gray-300 text-sm px-4 py-2.5 rounded-lg
                         outline-none cursor-pointer border border-gray-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status: All</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button className="flex items-center gap-2 bg-gray-800 border border-gray-700
                               text-gray-400 text-sm px-4 py-2.5 rounded-lg whitespace-nowrap">
              <Calendar size={15} className="text-gray-500" />
              Last 30 Days
            </button>

            <button
              onClick={() => {
                const rows = table
                  .getFilteredRowModel()
                  .rows.map((r) => r.original);
                const date = new Date().toISOString().slice(0, 10);
                exportToCSV(
                  rows as unknown as Record<string, unknown>[],
                  [
                    {
                      key: 'id',
                      header: 'Order ID',
                      transform: (v) => String(v).slice(-6).toUpperCase(),
                    },
                    {
                      key: 'createdAt',
                      header: 'Date',
                      transform: (v) =>
                        v ? new Date(v as string).toLocaleDateString() : '',
                    },
                    { key: 'user.name', header: 'Buyer' },
                    { key: 'shop.name', header: 'Shop' },
                    {
                      key: 'finalAmount',
                      header: 'Total',
                      transform: (v) =>
                        `$${(((v as number) ?? 0) / 100).toFixed(2)}`,
                    },
                    { key: 'status', header: 'Status' },
                    { key: 'paymentStatus', header: 'Payment Status' },
                  ],
                  `admin-orders-${date}`
                );
              }}
              className="flex items-center gap-2 bg-brand-primary-600 hover:bg-brand-primary-700
                         text-white text-sm px-4 py-2.5 rounded-lg whitespace-nowrap
                         font-medium transition-colors"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="bg-gray-800/60">
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3.5 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-widest"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-16 text-center"
                      >
                        <div className="flex flex-col items-center text-gray-500">
                          <Package size={40} className="mb-3 opacity-30" />
                          <p className="font-medium text-gray-300">
                            No orders found
                          </p>
                          <p className="text-sm mt-1">
                            Platform orders will appear here once placed
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-800 hover:bg-gray-800/40
                          transition-colors ${i % 2 === 1 ? 'bg-gray-800/20' : ''}`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {table.getRowModel().rows.length > 0 && (
              <div
                className="px-6 py-4 flex items-center justify-between
                           bg-gray-800/40 border-t border-gray-800"
              >
                <span className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-300">
                    {pageStart} – {pageEnd}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-gray-300">
                    {filteredTotal.toLocaleString()}
                  </span>{' '}
                  orders
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers(currentPage, pageCount).map((page, i) =>
                    page === '...' ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-gray-600 text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => table.setPageIndex(page as number)}
                        className={`w-8 h-8 rounded-md text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-brand-primary-600 text-white font-semibold'
                            : 'text-gray-500 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {(page as number) + 1}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
