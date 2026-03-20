'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useSellerStatistics } from '../../../../hooks/useSellerData';

const revenueData = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 4500 },
  { month: 'May', revenue: 6000 },
  { month: 'Jun', revenue: 7000 },
];

const orderStatusData = [
  { name: 'Completed', value: 140, color: '#10b981' },
  { name: 'Pending', value: 5, color: '#f59e0b' },
  { name: 'Cancelled', value: 5, color: '#ef4444' },
];

const DashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useSellerStatistics();

  if (statsLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-900 text-center py-8">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Revenue */}
          <div className="bg-[#ffffff] dark:bg-slate-800/50 rounded-lg p-5 border-l-4 border-l-blue-500 border border-slate-200 dark:border-slate-700/50">
            <div className="text-blue-600 text-sm font-medium mb-1">Total Revenue</div>
            <div className="text-gray-900 text-xl font-semibold mb-1">
              $
              {(stats.revenue.total / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-gray-500 text-xs">
              {stats.revenue.growth > 0 ? '+' : ''}
              {stats.revenue.growth.toFixed(1)}% from last month
            </div>
          </div>

          {/* Orders */}
          <div className="bg-[#ffffff] dark:bg-slate-800/50 rounded-lg p-5 border-l-4 border-l-emerald-500 border border-slate-200 dark:border-slate-700/50">
            <div className="text-emerald-600 text-sm font-medium mb-1">Total Orders</div>
            <div className="text-gray-900 text-xl font-semibold mb-1">
              {stats.orders.total.toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs">
              {stats.orders.thisMonth} this month
            </div>
          </div>

          {/* Products */}
          <div className="bg-[#ffffff] dark:bg-slate-800/50 rounded-lg p-4 border-l-4 border-l-purple-500 border border-slate-200 dark:border-slate-700/50">
            <div className="text-purple-600 text-sm font-medium mb-1">Total Products</div>
            <div className="text-gray-900 text-xl font-semibold mb-1">
              {stats.products.total.toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs">
              {stats.products.active} active, {stats.products.outOfStock} out of stock
            </div>
          </div>

          {/* Rating */}
          <div className="bg-[#ffffff] dark:bg-slate-800/50 rounded-lg p-4 border-l-4 border-l-orange-500 border border-slate-200 dark:border-slate-700/50">
            <div className="text-orange-600 text-sm font-medium mb-1">Shop Rating</div>
            <div className="text-gray-900 text-xl font-semibold mb-1">
              {stats.shop.rating.toFixed(1)} &#9733;
            </div>
            <div className="text-gray-500 text-xs">
              {stats.shop.isActive ? 'Shop Active' : 'Shop Inactive'}
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-[#ffffff] dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h2 className="text-gray-900 text-lg font-semibold">Revenue Trend</h2>
          <p className="text-gray-500 text-sm mb-4">Last 6 months performance</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-[#ffffff] dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
          <h2 className="text-gray-900 text-lg font-semibold">Order Status Distribution</h2>
          <p className="text-gray-500 text-sm mb-4">Current order breakdown</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orderStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                stroke="#0f172a"
                strokeWidth={2}
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                formatter={(value) => (
                  <span className="text-gray-900 text-sm ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Orders Bar Chart */}
      <div className="bg-[#ffffff] dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
        <h2 className="text-gray-900 text-lg font-semibold">Monthly Orders</h2>
        <p className="text-gray-500 text-sm mb-3">Order volume over the last 6 months</p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardPage;
