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

interface OrderStatusChartProps {
  data: OrderStatusDataPoint[];
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

const OrderStatusChart = ({ data }: OrderStatusChartProps) => (
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
          stroke="#D9DDE0"
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
            <span className="text-gray-900 text-sm ml-1">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default OrderStatusChart;
