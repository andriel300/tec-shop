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
import { useTranslations } from 'next-intl';

interface RevenueChartProps {
  data: ChartDataPoint[];
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const t = useTranslations('Dashboard');
  const theme = useUIStore((s) => s.theme);
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
  <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
    <h2 className="text-gray-900 font-display text-lg font-semibold">{t('revenueTrend')}</h2>
    <p className="text-gray-500 text-sm mb-4">{t('last6MonthsPerformance')}</p>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="month" stroke={axisStroke} tickFormatter={(v: string) => monthMap[v] ?? v} />
        <YAxis stroke={axisStroke} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name={t('chartRevenue')}
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
