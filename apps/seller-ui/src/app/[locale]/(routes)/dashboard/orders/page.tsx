/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  Clock,
  Calendar,
  Download,
} from 'lucide-react';
import { apiClient } from 'apps/seller-ui/src/lib/api/client';
import { Link } from 'apps/seller-ui/src/i18n/navigation';

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
  customerName?: string;
  customerEmail?: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  subtotalAmount: number;
  finalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

const fetchOrders = async () => {
  const res = await apiClient.get('/orders/get-sellers-orders');
  return res.data;
};

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

const getAvatarColor = (str: string) => {
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

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
  PENDING: {
    dot: 'bg-amber-400',
    text: 'text-amber-500',
    label: 'PENDING',
  },
  PAID: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-500',
    label: 'PAID',
  },
  SHIPPED: {
    dot: 'bg-blue-400',
    text: 'text-blue-500',
    label: 'SHIPPED',
  },
  DELIVERED: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-500',
    label: 'DELIVERED',
  },
  CANCELLED: {
    dot: 'bg-red-400',
    text: 'text-red-500',
    label: 'CANCELLED',
  },
};

const OrdersPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', statusFilter],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5,
  });

  const orders = (data?.data as Order[]) || [];
  const pagination = data?.pagination;

  const totalOrders = pagination?.total || orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((s, item) => s + item.sellerPayout, 0),
    0
  );
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order ID',
        cell: ({ row }: { row: { original: Order } }) => (
          <span className="font-mono text-sm font-semibold text-gray-900">
            #{row.original.orderNumber}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }: { row: { original: Order } }) => {
          const name = row.original.customerName;
          const email = row.original.customerEmail;
          const initials = getInitials(name, row.original.userId);
          const colorClass = getAvatarColor(row.original.userId);
          return (
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center shrink-0`}
              >
                <span className="text-white text-xs font-semibold">
                  {initials}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {name || `User ${row.original.userId.slice(0, 8)}`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{email || '—'}</p>
              </div>
            </div>
          );
        },
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
                  className="w-9 h-9 rounded-md bg-surface-container flex items-center
                             justify-center text-xs font-bold text-gray-500
                             border border-surface-container-highest overflow-hidden shrink-0"
                >
                  {item.productName.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {overflow > 0 && (
                <div
                  className="w-9 h-9 rounded-md bg-surface-container flex items-center
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
        cell: ({ row }: { row: { original: Order } }) => {
          const payout = row.original.items.reduce(
            (s, item) => s + item.sellerPayout,
            0
          );
          return (
            <span className="text-sm font-semibold text-gray-900">
              $
              {(payout / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: { original: Order } }) => {
          const cfg = STATUS_CONFIG[row.original.status] ?? {
            dot: 'bg-gray-400',
            text: 'text-gray-500',
            label: row.original.status,
          };
          return (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`}
              />
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
        header: 'Actions',
        cell: ({ row }: { row: { original: Order } }) => (
          <Link
            href={`/dashboard/order/${row.original.id}`}
            className="text-sm font-medium text-brand-primary-600
                       hover:text-brand-primary-700 transition-colors whitespace-nowrap"
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
    <div className="w-full min-h-screen p-8 bg-surface-dark">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Orders</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-gray-900">
          Orders Management
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Orders */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-brand-primary-600/15 p-2.5 rounded-lg">
                <Package size={18} className="text-brand-primary-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-pill">
                +12.5%
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Orders</p>
            <p className="font-display text-3xl font-bold text-gray-900">
              {totalOrders.toLocaleString()}
            </p>
          </div>
          <Package
            size={110}
            className="absolute -bottom-5 -right-5 text-brand-primary-600 opacity-[0.05]"
            strokeWidth={1}
          />
        </div>

        {/* Total Revenue */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500/15 p-2.5 rounded-lg">
                <DollarSign size={18} className="text-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-pill">
                +8.2%
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
            <p className="font-display text-3xl font-bold text-gray-900">
              $
              {(totalRevenue / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <DollarSign
            size={110}
            className="absolute -bottom-5 -right-5 text-emerald-500 opacity-[0.05]"
            strokeWidth={1}
          />
        </div>

        {/* Pending Fulfillment */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500/15 p-2.5 rounded-lg">
                <Clock size={18} className="text-red-500" />
              </div>
              {pendingCount > 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-500/10 px-2.5 py-0.5 rounded-pill">
                  High Priority
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mb-1">Pending Fulfillment</p>
            <p className="font-display text-3xl font-bold text-gray-900">
              {pendingCount}
            </p>
          </div>
          <Clock
            size={110}
            className="absolute -bottom-5 -right-5 text-red-500 opacity-[0.05]"
            strokeWidth={1}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
        {/* Search + Filters */}
        <div className="px-6 py-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-lg px-4 py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Filter by customer, ID or SKU..."
              className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400 text-sm"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              className="bg-surface-container text-gray-900 text-sm px-4 py-2.5 rounded-lg
                         outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status: All Orders</option>
              <option value="PENDING">Status: Pending</option>
              <option value="PAID">Status: Paid</option>
              <option value="SHIPPED">Status: Shipped</option>
              <option value="DELIVERED">Status: Delivered</option>
              <option value="CANCELLED">Status: Cancelled</option>
            </select>

            <button
              className="flex items-center gap-2 bg-surface-container text-gray-900
                         text-sm px-4 py-2.5 rounded-lg whitespace-nowrap"
            >
              <Calendar size={15} className="text-gray-500" />
              Last 30 Days
            </button>

            <button
              className="flex items-center gap-2 bg-brand-primary-600 text-white
                         text-sm px-4 py-2.5 rounded-lg whitespace-nowrap font-medium
                         hover:bg-brand-primary-700 transition-colors"
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
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="bg-surface-container-low"
                    >
                      {headerGroup.headers.map((header) => (
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
                          <p className="font-display font-medium text-gray-900">
                            No orders found
                          </p>
                          <p className="text-sm mt-1">
                            Orders from your customers will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-surface-container-low
                          hover:bg-surface-container-low transition-colors ${i % 2 === 1 ? 'bg-surface' : ''
                          }`}
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
                           bg-surface-container-low"
              >
                <span className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-900">
                    {pageStart} - {pageEnd}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-gray-900">
                    {filteredTotal.toLocaleString()}
                  </span>{' '}
                  orders
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-900
                               hover:bg-surface-container disabled:opacity-30
                               disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers(currentPage, pageCount).map((page, i) =>
                    page === '...' ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-gray-400 text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => table.setPageIndex(page as number)}
                        className={`w-8 h-8 rounded-md text-sm transition-colors ${currentPage === page
                          ? 'bg-brand-primary-600 text-white font-semibold'
                          : 'text-gray-500 hover:bg-surface-container hover:text-gray-900'
                          }`}
                      >
                        {(page as number) + 1}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-900
                               hover:bg-surface-container disabled:opacity-30
                               disabled:cursor-not-allowed transition-colors"
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
