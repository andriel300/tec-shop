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

interface RevenueChartProps {
  data: ChartDataPoint[];
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

const RevenueChart = ({ data }: RevenueChartProps) => (
  <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
    <h2 className="text-gray-900 font-display text-lg font-semibold">Revenue Trend</h2>
    <p className="text-gray-500 text-sm mb-4">Last 6 months performance</p>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E9EB" />
        <XAxis dataKey="month" stroke="#ABADAF" />
        <YAxis stroke="#ABADAF" />
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

export default RevenueChart;
