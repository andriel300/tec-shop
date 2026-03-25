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
import type { MonthlyOrderDataPoint } from '../../../../../lib/api/seller';
import { useUIStore } from '../../../../../store/ui.store';

interface MonthlyOrdersChartProps {
  data: MonthlyOrderDataPoint[];
}

const MonthlyOrdersChart = ({ data }: MonthlyOrdersChartProps) => {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  const tooltipStyle = isDark
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' };

  const gridStroke = isDark ? '#334155' : '#E5E9EB';
  const axisStroke = isDark ? '#64748b' : '#ABADAF';

  return (
  <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
    <h2 className="text-gray-900 font-display text-lg font-semibold">Monthly Orders</h2>
    <p className="text-gray-500 text-sm mb-3">Order volume over the last 6 months</p>
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="month" stroke={axisStroke} />
        <YAxis stroke={axisStroke} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
  );
};

export default MonthlyOrdersChart;
