'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { OrderStatusDataPoint } from '../../../../../lib/api/seller';
import { useUIStore } from '../../../../../store/ui.store';

interface OrderStatusChartProps {
  data: OrderStatusDataPoint[];
}

const OrderStatusChart = ({ data }: OrderStatusChartProps) => {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  const tooltipStyle = isDark
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' };

  const pieStroke = isDark ? '#1e293b' : '#D9DDE0';
  const legendTextColor = isDark ? '#94a3b8' : '#374151';

  return (
  <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
    <h2 className="text-gray-900 font-display text-lg font-semibold">Order Status Distribution</h2>
    <p className="text-gray-500 text-sm mb-4">Current order breakdown</p>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          stroke={pieStroke}
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: legendTextColor }} className="text-sm ml-1">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
  );
};

export default OrderStatusChart;
