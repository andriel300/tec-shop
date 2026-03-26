'use client';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Package,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import apiClient from '../../../../../lib/api/client';
import { exportToCSV } from '../../../../../lib/utils/csv-export';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sellerPayout: number;
  platformFee: number;
}

interface SellerPayout {
  id: string;
  totalAmount: number;
  platformFee: number;
  payoutAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stripeTransferId?: string;
  processedAt?: string;
  createdAt: string;
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
  payouts: SellerPayout[];
  createdAt: string;
}

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

const fetchPaidOrders = async () => {
  const res = await apiClient.get('/admin/orders', {
    params: { paymentStatus: 'COMPLETED' },
  });
  return res.data;
};

const PAYOUT_STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  PENDING:    { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  PROCESSING: { icon: TrendingUp,   color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'    },
  COMPLETED:  { icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  FAILED:     { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'     },
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PAID:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SHIPPED:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DELIVERED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const PaymentsPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', payoutStatusFilter],
    queryFn: fetchPaidOrders,
    staleTime: 1000 * 60 * 5,
  });

  const orders = (data?.data as Order[]) ?? [];

  const payments = useMemo(() => {
    return orders
      .map((order) => {
        const sellerEarnings = order.items.reduce(
          (sum, item) => sum + item.sellerPayout,
          0
        );
        const platformFees = order.items.reduce(
          (sum, item) => sum + item.platformFee,
          0
        );
        const totalSales = order.items.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        const payout = order.payouts?.[0];

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          totalSales,
          platformFees,
          sellerEarnings,
          payoutStatus: payout?.status ?? 'PENDING',
          payoutId: payout?.id,
          stripeTransferId: payout?.stripeTransferId,
          processedAt: payout?.processedAt,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        };
      })
      .filter((p) => !payoutStatusFilter || p.payoutStatus === payoutStatusFilter);
  }, [orders, payoutStatusFilter]);

  const platformRevenue = payments.reduce((sum, p) => sum + p.platformFees, 0);
  const pendingPayouts  = payments
    .filter((p) => p.payoutStatus === 'PENDING')
    .reduce((sum, p) => sum + p.sellerEarnings, 0);
  const completedPayouts = payments
    .filter((p) => p.payoutStatus === 'COMPLETED')
    .reduce((sum, p) => sum + p.sellerEarnings, 0);
  const totalTransactions = payments.length;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({
          column,
        }: {
          column: { toggleSorting: () => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Order Number
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => (
          <span className="text-white font-mono text-sm font-semibold">
            {row.original.orderNumber}
          </span>
        ),
      },
      {
        accessorKey: 'orderDate',
        header: ({
          column,
        }: {
          column: { toggleSorting: () => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Date
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => (
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={14} className="text-gray-500 shrink-0" />
            <span className="text-sm">
              {new Date(row.original.orderDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'itemCount',
        header: 'Items',
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => (
          <div className="flex items-center gap-2 text-gray-400">
            <Package size={14} className="text-gray-500 shrink-0" />
            <span className="text-sm">
              {row.original.itemCount} item{row.original.itemCount !== 1 ? 's' : ''}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'totalSales',
        header: ({
          column,
        }: {
          column: { toggleSorting: () => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Total Sales
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => (
          <span className="text-gray-300 text-sm font-medium">
            ${(row.original.totalSales / 100).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'platformFees',
        header: 'Platform Fee',
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => (
          <span className="text-emerald-400 text-sm font-semibold">
            +${(row.original.platformFees / 100).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'sellerEarnings',
        header: ({
          column,
        }: {
          column: { toggleSorting: () => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Seller Earnings
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => (
          <div className="flex items-center gap-1.5 text-gray-300 text-sm">
            <DollarSign size={14} className="text-gray-500" />
            <span>${(row.original.sellerEarnings / 100).toFixed(2)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'payoutStatus',
        header: 'Payout Status',
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => {
          const cfg =
            PAYOUT_STATUS_CONFIG[row.original.payoutStatus] ??
            PAYOUT_STATUS_CONFIG.PENDING;
          const Icon = cfg.icon;
          return (
            <div className="flex flex-col gap-1">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                            inline-flex items-center gap-1.5 w-fit ${cfg.bg} ${cfg.color}`}
              >
                <Icon size={12} />
                {row.original.payoutStatus}
              </span>
              {row.original.processedAt && (
                <span className="text-xs text-gray-600">
                  {new Date(row.original.processedAt).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric' }
                  )}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'orderStatus',
        header: 'Order Status',
        cell: ({ row }: { row: { original: (typeof payments)[0] } }) => (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                        ${ORDER_STATUS_COLORS[row.original.orderStatus] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
          >
            {row.original.orderStatus}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: 'orderDate', desc: true }],
    },
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
          <span className="text-gray-300 font-medium">Payments</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Payments & Payouts</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Platform Revenue */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                Admin Revenue
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Platform Revenue</p>
            <p className="text-3xl font-bold text-white">
              ${(platformRevenue / 100).toFixed(2)}
            </p>
          </div>
          <TrendingUp
            size={110}
            className="absolute -bottom-5 -right-5 text-emerald-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Completed Payouts */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-brand-primary-600/10 p-2.5 rounded-lg">
                <CheckCircle size={18} className="text-brand-primary-400" />
              </div>
              <span className="text-xs font-semibold text-brand-primary-400 bg-brand-primary-600/10 px-2.5 py-0.5 rounded-full">
                Disbursed
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Completed Payouts</p>
            <p className="text-3xl font-bold text-white">
              ${(completedPayouts / 100).toFixed(2)}
            </p>
          </div>
          <CheckCircle
            size={110}
            className="absolute -bottom-5 -right-5 text-brand-primary-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Pending Payouts */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-lg">
                <Clock size={18} className="text-amber-400" />
              </div>
              {pendingPayouts > 0 && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Queued
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">Pending Payouts</p>
            <p className="text-3xl font-bold text-white">
              ${(pendingPayouts / 100).toFixed(2)}
            </p>
          </div>
          <Clock
            size={110}
            className="absolute -bottom-5 -right-5 text-amber-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Total Transactions */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/10 p-2.5 rounded-lg">
                <DollarSign size={18} className="text-purple-400" />
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-0.5 rounded-full">
                All Time
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Transactions</p>
            <p className="text-3xl font-bold text-white">
              {totalTransactions.toLocaleString()}
            </p>
          </div>
          <DollarSign
            size={110}
            className="absolute -bottom-5 -right-5 text-purple-400 opacity-[0.04]"
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
              placeholder="Search by order number..."
              className="w-full bg-transparent text-white outline-none placeholder:text-gray-500 text-sm"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              className="bg-gray-800 text-gray-300 text-sm px-4 py-2.5 rounded-lg
                         outline-none cursor-pointer border border-gray-700"
              value={payoutStatusFilter}
              onChange={(e) => setPayoutStatusFilter(e.target.value)}
            >
              <option value="">Payout: All</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
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
                    { key: 'orderNumber', header: 'Order Number' },
                    {
                      key: 'orderDate',
                      header: 'Date',
                      transform: (v) =>
                        v ? new Date(v as string).toLocaleDateString() : '',
                    },
                    { key: 'itemCount', header: 'Items' },
                    {
                      key: 'totalSales',
                      header: 'Total Sales',
                      transform: (v) =>
                        `$${(((v as number) ?? 0) / 100).toFixed(2)}`,
                    },
                    {
                      key: 'platformFees',
                      header: 'Platform Fee',
                      transform: (v) =>
                        `$${(((v as number) ?? 0) / 100).toFixed(2)}`,
                    },
                    {
                      key: 'sellerEarnings',
                      header: 'Seller Earnings',
                      transform: (v) =>
                        `$${(((v as number) ?? 0) / 100).toFixed(2)}`,
                    },
                    { key: 'payoutStatus', header: 'Payout Status' },
                    { key: 'orderStatus', header: 'Order Status' },
                  ],
                  `admin-payments-${date}`
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
                          <DollarSign
                            size={40}
                            className="mb-3 opacity-30"
                          />
                          <p className="font-medium text-gray-300">
                            No payments found
                          </p>
                          <p className="text-sm mt-1">
                            Completed order payments will appear here
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
                  results
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

export default PaymentsPage;
