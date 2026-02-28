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
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
} from 'lucide-react';
import { Breadcrumb } from '../../../../../shared/components/navigation/Breadcrumb';
import apiClient from '../../../../../lib/api/client';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Link } from 'apps/admin-ui/src/i18n/navigation';

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
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sellerPayout: number;
}

const fetchOrders = async () => {
  const res = await apiClient.get('/admin/orders');
  return res.data;
};

const OrdersTable = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5,
  });

  const orders = (data?.data as Order[]) || [];
  const pagination = data?.pagination;

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    const sellerItems = order.items.reduce(
      (itemSum, item) => itemSum + item.sellerPayout,
      0
    );
    return sum + sellerItems;
  }, 0);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Order ID',
        cell: ({ row }: { row: { original: Order } }) => (
          <span className="text-white font-mono text-sm">
            #{row.original.id.slice(-6).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: 'shop.name',
        header: 'Shop',

        cell: ({ row }: any) => (
          <span className="text-white">
            {row.original.shop?.name ?? 'Unknown Shop'}
          </span>
        ),
      },
      {
        accessorKey: 'user.name',
        header: 'Buyer',

        cell: ({ row }: any) => (
          <span className="text-white">
            {row.original.user?.name ?? 'Guest'}
          </span>
        ),
      },
      {
        accessorKey: 'finalAmount',
        header: 'Total',
        cell: ({ row }: { row: { original: Order } }) => (
          <span className="text-white">
            ${((row.original.finalAmount || 0) / 100).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Order Status',
        cell: ({ row }: { row: { original: Order } }) => {
          const statusColors: Record<string, string> = {
            PENDING:
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            PAID: 'bg-green-500/20 text-green-400 border border-green-500/30',
            SHIPPED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            DELIVERED:
              'bg-purple-500/20 text-purple-400 border border-purple-500/30',
            CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
          };
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[row.original.status] ||
                'bg-gray-500/20 text-gray-400'
              }`}
            >
              {row.original.status}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }: { row: { original: Order } }) => {
          const paymentColors: Record<string, string> = {
            PENDING: 'text-yellow-400',
            COMPLETED: 'text-green-400',
            FAILED: 'text-red-400',
            REFUNDED: 'text-orange-400',
          };
          return (
            <span
              className={`text-sm font-medium ${
                paymentColors[row.original.paymentStatus] || 'text-gray-400'
              }`}
            >
              {row.original.paymentStatus}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }: { row: { original: Order } }) => {
          const date = new Date(row.original.createdAt).toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          );
          return <span className="text-gray-300 text-sm">{date}</span>;
        },
      },
      {
        header: 'Actions',
        cell: ({ row }: { row: { original: Order } }) => (
          <Link
            href={`/dashboard/order/${row.original.id}`}
            className="text-brand-primary hover:text-blue-400 transition-colors inline-flex items-center gap-1"
          >
            <Eye size={18} />
            <span className="text-sm">View</span>
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl text-white font-bold mb-2">
          Orders Management
        </h2>
        <Breadcrumb title="All Orders" items={[]} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-white">
                {pagination?.total || totalOrders}
              </p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Package size={24} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">
                Total Revenue (Your Share)
              </p>
              <p className="text-3xl font-bold text-green-400">
                ${(totalRevenue / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-green-400" />
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
            placeholder="Search by order number, product name..."
            className="w-full bg-transparent rounded-sm text-white outline-none placeholder-gray-500"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <select
          className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 outline-none focus:border-brand-primary transition-colors"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
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
                          <Package size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium">No orders found</p>
                          <p className="text-sm mt-1">
                            Orders from your customers will appear here
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
                      (_, i) => i
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

export default OrdersTable;
