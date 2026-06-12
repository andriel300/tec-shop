'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyOrderDataPoint } from '../../../../../lib/api/seller';
import { useUIStore } from '../../../../../store/ui.store';
import { useTranslations } from 'next-intl';

interface MonthlyOrdersChartProps {
  data: MonthlyOrderDataPoint[];
}

const MonthlyOrdersChart = ({ data }: MonthlyOrdersChartProps) => {
  const t = useTranslations('Dashboard');
  const theme = useUIStore((s) => s.theme);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isDark = theme === 'dark';

  const monthMap: Record<string, string> = {
    Jan: t('monthJan'), Feb: t('monthFeb'), Mar: t('monthMar'),
    Apr: t('monthApr'), May: t('monthMay'), Jun: t('monthJun'),
    Jul: t('monthJul'), Aug: t('monthAug'), Sep: t('monthSep'),
    Oct: t('monthOct'), Nov: t('monthNov'), Dec: t('monthDec'),
  };

  const tooltipStyle = isDark
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' };
  const tooltipLabelStyle = { color: isDark ? '#94a3b8' : '#64748b' };
  const tooltipItemStyle  = { color: isDark ? '#f1f5f9' : '#0f172a' };

  const gridStroke = isDark ? '#334155' : '#E5E9EB';
  const axisStroke = isDark ? '#64748b' : '#ABADAF';

  return (
  <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
    <h2 className="text-gray-900 font-display text-lg font-semibold">{t('monthlyOrders')}</h2>
    <p className="text-gray-500 text-sm mb-3">{t('orderVolumeLast6Months')}</p>
    <ResponsiveContainer width="100%" height={230}>
      <BarChart
        data={data}
        onMouseMove={(state: any) =>
          setActiveIndex(state.isTooltipActive ? (state.activeTooltipIndex ?? null) : null)
        }
        onMouseLeave={() => setActiveIndex(null)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="month" stroke={axisStroke} tickFormatter={(v: string) => monthMap[v] ?? v} />
        <YAxis stroke={axisStroke} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          cursor={{ fill: 'transparent' }}
        />
        <Bar dataKey="orders" name={t('chartOrders')} radius={[8, 8, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={activeIndex === index ? '#6ee7b7' : '#10b981'}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
  );
};

export default MonthlyOrdersChart;
