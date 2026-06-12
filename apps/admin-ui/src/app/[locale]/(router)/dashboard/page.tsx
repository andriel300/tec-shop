'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import nextDynamic from 'next/dynamic';
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
import { useTranslations } from 'next-intl';
import {
  usePlatformStatistics,
  useAllOrders,
} from '../../../../hooks/useAdminData';

const COLORS = ['#4ade80', '#facc15', '#60a5fa'];

const OrdersTable = () => {
  const t = useTranslations('Dashboard');
  const { data: ordersData, isLoading } = useAllOrders({ limit: 8 });

  const columns = [
    {
      header: t('colOrderId'),
      accessorKey: 'id',
      cell: ({ getValue }: { getValue: () => string }) => {
        const id = getValue();
        return <span className="font-mono text-xs">{id.slice(0, 8)}...</span>;
      },
    },
    {
      header: t('colItems'),
      accessorKey: 'items',
      cell: ({ getValue }: { getValue: () => Array<{ quantity: number }> }) => {
        const items = getValue();
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        return <span>{t('itemCount', { count: totalItems })}</span>;
      },
    },
    {
      header: t('colAmount'),
      accessorKey: 'finalAmount',
      cell: ({ getValue }: { getValue: () => number }) => {
        const amount = getValue();
        return <span>${(amount / 100).toFixed(2)}</span>;
      },
    },
    {
      header: t('colPayment'),
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
      header: t('colStatus'),
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

  const table = useReactTable({
    data: ordersData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="mt-6">
        <h2 className="text-white text-xl font-semibold mb-4">
          {t('recentOrdersTitle')}
          <span className="block text-sm text-slate-400 font-normal">
            {t('recentOrdersSubtitle')}
          </span>
        </h2>
        <div className="text-white text-center py-8">{t('loadingOrders')}</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-white text-xl font-semibold mb-4">
        {t('recentOrdersTitle')}
        <span className="block text-sm text-slate-400 font-normal">
          {t('recentOrdersSubtitle')}
        </span>
      </h2>
      <div className="rounded-xl overflow-hidden border border-[#1f1f1f]">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-[#0a0a0a] text-slate-500">
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
                  {t('noOrders')}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[#1a1a1a] hover:bg-white/[0.03] transition"
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

// Dynamic imports for chart components to avoid SSR issues
const SaleChart = nextDynamic(
  () => import('../../../../shared/components/charts/sale-chart'),
  { ssr: false }
);

const GeographicalMap = nextDynamic(
  () => import('../../../../shared/components/charts/geographicalMap'),
  { ssr: false }
);

// Dashboard Layout
const DashboardPage = () => {
  const t = useTranslations('Dashboard');
  const { data: stats, isLoading: statsLoading } = usePlatformStatistics();

  const deviceData = [
    { name: t('devicePhone'), value: 55 },
    { name: t('deviceTablet'), value: 20 },
    { name: t('deviceComputer'), value: 25 },
  ];

  return (
    <div className="p-8">
      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="text-white text-center py-8 mb-6">
          {t('loadingStats')}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5">
            <div className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide">
              {t('statTotalUsers')}
            </div>
            <div className="text-blue-400 text-3xl font-bold mb-1.5 tabular-nums">
              {stats.users.total.toLocaleString()}
            </div>
            <div className="text-slate-600 text-xs">
              {t('statTotalUsersDesc', {
                customers: stats.users.customers,
                sellers: stats.users.sellers,
              })}
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5">
            <div className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide">
              {t('statActiveShops')}
            </div>
            <div className="text-violet-400 text-3xl font-bold mb-1.5 tabular-nums">
              {stats.sellers.activeShops.toLocaleString()}
            </div>
            <div className="text-slate-600 text-xs">
              {t('statActiveShopsDesc', { verified: stats.sellers.verified })}
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5">
            <div className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide">
              {t('statTotalOrders')}
            </div>
            <div className="text-emerald-400 text-3xl font-bold mb-1.5 tabular-nums">
              {stats.orders.total.toLocaleString()}
            </div>
            <div className="text-slate-600 text-xs">
              {t('statTotalOrdersDesc', {
                completed: stats.orders.completed,
                pending: stats.orders.pending,
              })}
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5">
            <div className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide">
              {t('statRevenue')}
            </div>
            <div className="text-amber-400 text-3xl font-bold mb-1.5 tabular-nums">
              $
              {(stats.revenue.total / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-slate-600 text-xs">
              {t('statRevenueDesc', {
                fee: `$${(stats.revenue.platformFee / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Top Charts */}
      <div className="w-full flex gap-8">
        {/* Revenue Chart */}
        <div className="w-[65%]">
          <div className="rounded-2xl shadow-xl">
            <h2 className="text-white text-xl font-semibold">
              {t('revenueTitle')}
              <span className="block text-sm text-slate-400 font-normal">
                {t('revenueSubtitle')}
              </span>
            </h2>
            <SaleChart
              data={stats?.monthlySales?.map((d) => ({
                month: d.month,
                value: d.revenue / 100,
              }))}
            />
          </div>
        </div>

        {/* Device Usage */}
        <div className="w-[35%] rounded-2xl shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-2">
            {t('deviceUsageTitle')}
            <span className="block text-sm text-slate-400 font-normal">
              {t('deviceUsageSubtitle')}
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
                  itemStyle={{ color: '#fff' }}
                />

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

      {/* Geo Map + Orders */}
      <div className="w-full flex gap-8">
        {/* Map */}
        <div className="w-[60%]">
          <h2 className="text-white text-xl font-semibold mt-6">
            {t('mapTitle')}
            <span className="block text-sm text-slate-400 font-normal">
              {t('mapSubtitle')}
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
