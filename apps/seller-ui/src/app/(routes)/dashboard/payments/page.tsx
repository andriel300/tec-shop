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
import apiClient from 'apps/seller-ui/src/lib/api/client';
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
} from 'lucide-react';
import { Breadcrumb } from 'apps/seller-ui/src/components/navigation/Breadcrumb';

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

const fetchPaidOrders = async () => {
  // Fetch only PAID, SHIPPED, or DELIVERED orders (paymentStatus = COMPLETED)
  const res = await apiClient.get('/orders/get-sellers-orders', {
    params: {
      paymentStatus: 'COMPLETED',
    },
  });
  return res.data;
};

const PaymentsPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-payments', payoutStatusFilter],
    queryFn: fetchPaidOrders,
    staleTime: 1000 * 60 * 5,
  });

  const orders = (data?.data as Order[]) || [];

  // Transform orders into payment records (one row per order)
  const payments = useMemo(() => {
    return orders
      .map((order) => {
        // Calculate seller earnings from items
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

        // Get payout information (first payout for this seller)
        const payout = order.payouts?.[0];

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          totalSales,
          platformFees,
          earnings: sellerEarnings,
          payoutStatus: payout?.status || 'PENDING',
          payoutId: payout?.id,
          stripeTransferId: payout?.stripeTransferId,
          processedAt: payout?.processedAt,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        };
      })
      .filter((payment) => {
        if (!payoutStatusFilter) return true;
        return payment.payoutStatus === payoutStatusFilter;
      });
  }, [orders, payoutStatusFilter]);

  // Calculate stats
  const totalEarnings = payments.reduce((sum, p) => sum + p.earnings, 0);
  const pendingEarnings = payments
    .filter((p) => p.payoutStatus === 'PENDING')
    .reduce((sum, p) => sum + p.earnings, 0);
  const completedEarnings = payments
    .filter((p) => p.payoutStatus === 'COMPLETED')
    .reduce((sum, p) => sum + p.earnings, 0);
  const totalTransactions = payments.length;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({ column }: { column: { toggleSorting: (desc?: boolean) => void } }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Order Number
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: typeof payments[0] } }) => (
          <span className="text-white font-mono text-sm">
            {row.original.orderNumber}
          </span>
        ),
      },
      {
        accessorKey: 'orderDate',
        header: ({ column }: { column: { toggleSorting: (desc?: boolean) => void } }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Order Date
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: typeof payments[0] } }) => {
          const date = new Date(row.original.orderDate).toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          );
          return (
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-sm">{date}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'itemCount',
        header: 'Items',
        cell: ({ row }: { row: { original: typeof payments[0] } }) => (
          <div className="flex items-center gap-2 text-gray-300">
            <Package size={16} className="text-gray-500" />
            <span className="text-sm">
              {row.original.itemCount} item{row.original.itemCount !== 1 ? 's' : ''}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'totalSales',
        header: ({ column }: { column: { toggleSorting: (desc?: boolean) => void } }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Total Sales
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: typeof payments[0] } }) => (
          <span className="text-gray-300 font-medium">
            ${(row.original.totalSales / 100).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'platformFees',
        header: 'Platform Fee',
        cell: ({ row }: { row: { original: typeof payments[0] } }) => (
          <span className="text-orange-400 text-sm">
            -${(row.original.platformFees / 100).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'earnings',
        header: ({ column }: { column: { toggleSorting: (desc?: boolean) => void } }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            Your Earnings
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }: { row: { original: typeof payments[0] } }) => (
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <DollarSign size={16} />
            <span>${(row.original.earnings / 100).toFixed(2)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'payoutStatus',
        header: 'Payout Status',
        cell: ({ row }: { row: { original: typeof payments[0] } }) => {
          const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
            PENDING: {
              icon: Clock,
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/20 border-yellow-500/30',
            },
            PROCESSING: {
              icon: TrendingUp,
              color: 'text-blue-400',
              bg: 'bg-blue-500/20 border-blue-500/30',
            },
            COMPLETED: {
              icon: CheckCircle,
              color: 'text-green-400',
              bg: 'bg-green-500/20 border-green-500/30',
            },
            FAILED: {
              icon: XCircle,
              color: 'text-red-400',
              bg: 'bg-red-500/20 border-red-500/30',
            },
          };

          const config = statusConfig[row.original.payoutStatus] || statusConfig.PENDING;
          const Icon = config.icon;

          return (
            <div className="flex flex-col gap-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 w-fit ${config.bg} ${config.color}`}
              >
                <Icon size={14} />
                {row.original.payoutStatus}
              </span>
              {row.original.processedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(row.original.processedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'orderStatus',
        header: 'Order Status',
        cell: ({ row }: { row: { original: typeof payments[0] } }) => {
          const statusColors: Record<string, string> = {
            PAID: 'bg-green-500/20 text-green-400 border border-green-500/30',
            SHIPPED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            DELIVERED:
              'bg-purple-500/20 text-purple-400 border border-purple-500/30',
          };
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[row.original.orderStatus] ||
                'bg-gray-500/20 text-gray-400'
              }`}
            >
              {row.original.orderStatus}
            </span>
          );
        },
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
      pagination: {
        pageSize: 10,
      },
      sorting: [{ id: 'orderDate', desc: true }],
    },
  });

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl text-white font-bold mb-2">
          Payments & Earnings
        </h2>
        <Breadcrumb title="Payments" items={[]} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg p-6 border border-green-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-green-400">
                ${(totalEarnings / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-6 border border-blue-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Completed Payouts</p>
              <p className="text-3xl font-bold text-blue-400">
                ${(completedEarnings / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <CheckCircle size={24} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 rounded-lg p-6 border border-yellow-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending Payouts</p>
              <p className="text-3xl font-bold text-yellow-400">
                ${(pendingEarnings / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Clock size={24} className="text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-lg p-6 border border-purple-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-purple-400">
                {totalTransactions}
              </p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <TrendingUp size={24} className="text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 items-center bg-gray-900 p-3 rounded-lg border border-gray-700 flex flex-row">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by order number..."
            className="w-full bg-transparent rounded-sm text-white outline-none placeholder-gray-500"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <select
          className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 outline-none focus:border-brand-primary transition-colors"
          value={payoutStatusFilter}
          onChange={(e) => setPayoutStatusFilter(e.target.value)}
        >
          <option value="">All Payout Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="bg-gray-800 border-b border-gray-700"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
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

                <tbody className="divide-y divide-gray-800">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <DollarSign size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium">No payments found</p>
                          <p className="text-sm mt-1">
                            Your earnings from completed orders will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-800/50 transition-colors"
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
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>
                    Showing{' '}
                    <span className="font-medium text-white">
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-white">
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-white">
                      {table.getFilteredRowModel().rows.length}
                    </span>{' '}
                    results
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: table.getPageCount() },
                      (_v, i) => i
                    ).map((pageIndex) => (
                      <button
                        key={pageIndex}
                        onClick={() => table.setPageIndex(pageIndex)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          table.getState().pagination.pageIndex === pageIndex
                            ? 'bg-brand-primary text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {pageIndex + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    Next
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
