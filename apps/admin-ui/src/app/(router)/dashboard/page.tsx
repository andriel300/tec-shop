'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  usePlatformStatistics,
  useAllOrders,
} from '../../../hooks/useAdminData';

// Dynamic imports for chart components to avoid SSR issues
const SaleChart = dynamic(() => import('../../../shared/components/charts/sale-chart'), {
  ssr: false,
  loading: () => <div className="text-white text-center py-8">Loading chart...</div>,
});

const GeographicalMap = dynamic(() => import('../../../shared/components/charts/geographicalMap'), {
  ssr: false,
  loading: () => <div className="text-white text-center py-8">Loading map...</div>,
});

// Device data (placeholder - can be replaced with real analytics data later)
const deviceData = [
  { name: 'Phone', value: 55 },
  { name: 'Tablet', value: 20 },
  { name: 'Computer', value: 25 },
];

const COLORS = ['#4ade80', '#facc15', '#60a5fa'];

// Orders table columns
const columns = [
  {
    header: 'Order ID',
    accessorKey: 'id',
    cell: ({ getValue }: { getValue: () => string }) => {
      const id = getValue();
      return <span className="font-mono text-xs">{id.slice(0, 8)}...</span>;
    },
  },
  {
    header: 'Items',
    accessorKey: 'items',
    cell: ({ getValue }: { getValue: () => Array<{ quantity: number }> }) => {
      const items = getValue();
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      return <span>{totalItems} items</span>;
    },
  },
  {
    header: 'Amount',
    accessorKey: 'finalAmount',
    cell: ({ getValue }: { getValue: () => number }) => {
      const amount = getValue();
      return <span>${(amount / 100).toFixed(2)}</span>;
    },
  },
  {
    header: 'Payment',
    accessorKey: 'paymentStatus',
    cell: ({ getValue }: { getValue: () => string }) => {
      const value = getValue();
      const color =
        value === 'COMPLETED'
          ? 'text-green-400'
          : value === 'PENDING'
          ? 'text-yellow-400'
          : value === 'FAILED'
          ? 'text-red-400'
          : 'text-purple-400';
      return <span className={`font-medium ${color}`}>{value}</span>;
    },
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }: { getValue: () => string }) => {
      const value = getValue();
      const color =
        value === 'DELIVERED'
          ? 'text-green-400'
          : value === 'SHIPPED'
          ? 'text-blue-400'
          : value === 'PAID'
          ? 'text-cyan-400'
          : value === 'PENDING'
          ? 'text-yellow-400'
          : 'text-red-400';
      return <span className={`font-medium ${color}`}>{value}</span>;
    },
  },
];

const OrdersTable = () => {
  const { data: ordersData, isLoading } = useAllOrders({ limit: 8 });

  const table = useReactTable({
    data: ordersData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="mt-6">
        <h2 className="text-white text-xl font-semibold mb-4">
          Recent Orders
          <span className="block text-sm text-slate-400 font-normal">
            A quick snapshot of your latest transactions.
          </span>
        </h2>
        <div className="text-white text-center py-8">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-white text-xl font-semibold mb-4">
        Recent Orders
        <span className="block text-sm text-slate-400 font-normal">
          A quick snapshot of your latest transactions.
        </span>
      </h2>
      <div className="!rounded shadow-xl overflow-hidden border border-slate-700">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-slate-900 text-slate-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left">
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-600 hover:bg-slate-800 transition"
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Dashboard Layout
const DashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = usePlatformStatistics();

  return (
    <div className="p-8">
      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="text-white text-center py-8 mb-6">
          Loading statistics...
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 shadow-xl">
            <div className="text-blue-100 text-sm mb-2">Total Users</div>
            <div className="text-white text-3xl font-semibold mb-2">
              {stats.users.total.toLocaleString()}
            </div>
            <div className="text-blue-200 text-xs">
              {stats.users.customers} customers, {stats.users.sellers} sellers
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 shadow-xl">
            <div className="text-purple-100 text-sm mb-2">Active Shops</div>
            <div className="text-white text-3xl font-semibold mb-2">
              {stats.sellers.activeShops.toLocaleString()}
            </div>
            <div className="text-purple-200 text-xs">
              {stats.sellers.verified} verified sellers
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 shadow-xl">
            <div className="text-green-100 text-sm mb-2">Total Orders</div>
            <div className="text-white text-3xl font-semibold mb-2">
              {stats.orders.total.toLocaleString()}
            </div>
            <div className="text-green-200 text-xs">
              {stats.orders.completed} completed, {stats.orders.pending} pending
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6 shadow-xl">
            <div className="text-orange-100 text-sm mb-2">Platform Revenue</div>
            <div className="text-white text-3xl font-semibold mb-2">
              $
              {(stats.revenue.total / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-orange-200 text-xs">
              $
              {(stats.revenue.platformFee / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              in fees
            </div>
          </div>
        </div>
      ) : null}

      {/*Top Charts */}
      <div className="w-full flex gap-8">
        {/*Revenue Chart*/}
        <div className="w-[65%]">
          <div className="rounded-2xl shadow-xl">
            <h2 className="text-white text-xl font-semibold">
              Revenue
              <span className="block text-sm text-slate-400 font-normal">
                Last 6 months performance
              </span>
            </h2>
            <SaleChart />
          </div>
        </div>

        {/* Device Usage */}
        <div className="w-[35%] rounded-2xl shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-2">
            Device Usage
            <span className="block text-sm text-slate-400 font-normal">
              How users access your platform
            </span>
          </h2>
          <div className="mt-14">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  <filter
                    id="shadow"
                    x="-10%"
                    y="-10%"
                    width="120%"
                    height="120%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="4"
                      floodColor="#000"
                      floodOpacity="0.2"
                    />
                  </filter>
                </defs>

                <Pie
                  data={deviceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                  isAnimationActive
                  filter="url(#shadow)"
                >
                  {deviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '3fff' }}
                />

                {/* External Legend */}
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-white text-sm ml-1">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geo Map  + Orders */}
      <div className="w-full flex gap-8">
        {/* Map */}
        <div className="w-[60%]">
          <h2 className="text-white text-xl font-semibold mt-6">
            User & Seller Distribution
            <span className="block text-sm text-slate-400 font-normal">
              Visual breakdown of global user & seller activity.
            </span>
          </h2>
          <GeographicalMap
            data={stats?.geographicDistribution}
            isLoading={statsLoading}
          />
        </div>

        {/* Orders Table */}
        <div className="w-[40%]">
          <OrdersTable />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
