'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint } from '../../../../../lib/api/seller';
import { useUIStore } from '../../../../../store/ui.store';

interface RevenueChartProps {
  data: ChartDataPoint[];
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  const tooltipStyle = isDark
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' };

  const gridStroke = isDark ? '#334155' : '#E5E9EB';
  const axisStroke = isDark ? '#64748b' : '#ABADAF';

  return (
  <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
    <h2 className="text-gray-900 font-display text-lg font-semibold">Revenue Trend</h2>
    <p className="text-gray-500 text-sm mb-4">Last 6 months performance</p>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="month" stroke={axisStroke} />
        <YAxis stroke={axisStroke} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#0058BB"
          strokeWidth={2}
          dot={{ fill: '#0058BB', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
  );
};

export default RevenueChart;
