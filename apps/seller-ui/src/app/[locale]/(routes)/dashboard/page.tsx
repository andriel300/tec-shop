'use client';

export const dynamic = 'force-dynamic';

import { useSellerStatistics, useSellerChartData } from '../../../../hooks/useSellerData';
import {
  StatsCards,
  RevenueChart,
  OrderStatusChart,
  MonthlyOrdersChart,
} from './_charts-kpi';

const DashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useSellerStatistics();
  const { data: chartData, isLoading: chartLoading } = useSellerChartData();

  if (statsLoading || chartLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-900 text-center py-8">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-gray-900">Dashboard</h1>

      {stats && <StatsCards stats={stats} />}

      {chartData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueChart data={chartData.revenueData} />
            <OrderStatusChart data={chartData.orderStatusData} />
          </div>

          <MonthlyOrdersChart data={chartData.monthlyOrdersData} />
        </>
      )}
    </div>
  );
};

export default DashboardPage;
