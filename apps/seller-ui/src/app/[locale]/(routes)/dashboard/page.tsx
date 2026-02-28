'use client';

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

// Mock data for charts (will be replaced with real data from order-service)
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
        <div className="text-white text-center py-8">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-600/40 to-gray-500/20 rounded-lg p-6 border border-gray-700/50">
            <div className="text-blue-100 text-sm mb-2">Total Revenue</div>
            <div className="text-white text-3xl font-semibold mb-2">
              $
              {(stats.revenue.total / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-blue-200 text-xs">
              {stats.revenue.growth > 0 ? '+' : ''}
              {stats.revenue.growth.toFixed(1)}% from last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-600/40 to-gray-500/20 rounded-lg p-6 border border-gray-700/50">
            <div className="text-green-100 text-sm mb-2">Total Orders</div>
            <div className="text-white text-3xl font-semibold mb-2">
              {stats.orders.total.toLocaleString()}
            </div>
            <div className="text-green-200 text-xs">
              {stats.orders.thisMonth} this month
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-600/40 to-gray-500/20 rounded-lg p-6 border border-gray-700/50">
            <div className="text-purple-100 text-sm mb-2">Total Products</div>
            <div className="text-white text-3xl font-semibold mb-2">
              {stats.products.total.toLocaleString()}
            </div>
            <div className="text-purple-200 text-xs">
              {stats.products.active} active, {stats.products.outOfStock} out of
              stock
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-600/40 to-gray-500/20 rounded-lg p-6 border border-gray-700/50">
            <div className="text-orange-100 text-sm mb-2">Shop Rating</div>
            <div className="text-white text-3xl font-semibold mb-2">
              {stats.shop.rating.toFixed(1)} &#9733;
            </div>
            <div className="text-orange-200 text-xs">
              {stats.shop.isActive ? 'Shop Active' : 'Shop Inactive'}
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-gradient-to-br from-gray-700/40 to-gray-500/20 rounded-lg p-6 border border-slate-700">
          <h2 className="text-white text-xl font-semibold mb-4">
            Revenue Trend
            <span className="block text-sm text-slate-400 font-normal">
              Last 6 months performance
            </span>
          </h2>
          <ResponsiveContainer width="100%" height={300}>
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
        <div className="bg-gradient-to-br from-gray-700/40 to-gray-500/20 rounded-lg p-6 border border-slate-700">
          <h2 className="text-white text-xl font-semibold mb-4">
            Order Status Distribution
            <span className="block text-sm text-slate-400 font-normal">
              Current order breakdown
            </span>
          </h2>
          <ResponsiveContainer width="100%" height={300}>
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
                  <span className="text-white text-sm ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Orders Bar Chart */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h2 className="text-white text-xl font-semibold mb-4">
          Monthly Orders
          <span className="block text-sm text-slate-400 font-normal">
            Order volume over the last 6 months
          </span>
        </h2>
        <ResponsiveContainer width="100%" height={300}>
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
