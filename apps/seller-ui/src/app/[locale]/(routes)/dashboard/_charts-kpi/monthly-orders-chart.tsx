'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint } from '../../../../../lib/api/seller';

interface MonthlyOrdersChartProps {
  data: ChartDataPoint[];
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

const MonthlyOrdersChart = ({ data }: MonthlyOrdersChartProps) => (
  <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
    <h2 className="text-gray-900 font-display text-lg font-semibold">Monthly Orders</h2>
    <p className="text-gray-500 text-sm mb-3">Order volume over the last 6 months</p>
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E9EB" />
        <XAxis dataKey="month" stroke="#ABADAF" />
        <YAxis stroke="#ABADAF" />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default MonthlyOrdersChart;
