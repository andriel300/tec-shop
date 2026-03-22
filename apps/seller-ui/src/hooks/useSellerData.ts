import { useQuery } from '@tanstack/react-query';
import * as sellerApi from '../lib/api/seller';
import type { SellerStatistics, SellerChartData } from '../lib/api/seller';
import { useAuth } from '../contexts/auth-context';

// Query keys
export const sellerKeys = {
  all: ['seller'] as const,
  statistics: () => [...sellerKeys.all, 'statistics'] as const,
  chartData: () => [...sellerKeys.all, 'chart-data'] as const,
};

const DEMO_EMAIL = 'test@exame.com';

const DEMO_CHART_DATA: SellerChartData = {
  revenueData: [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 5000 },
    { month: 'Apr', revenue: 4500 },
    { month: 'May', revenue: 6000 },
    { month: 'Jun', revenue: 7000 },
  ],
  monthlyOrdersData: [
    { month: 'Jan', revenue: 42 },
    { month: 'Feb', revenue: 31 },
    { month: 'Mar', revenue: 55 },
    { month: 'Apr', revenue: 48 },
    { month: 'May', revenue: 63 },
    { month: 'Jun', revenue: 71 },
  ],
  orderStatusData: [
    { name: 'Completed', value: 140, color: '#10b981' },
    { name: 'Pending', value: 5, color: '#f59e0b' },
    { name: 'Cancelled', value: 5, color: '#ef4444' },
  ],
};

// Hooks
export const useSellerChartData = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isDemo = user?.email === DEMO_EMAIL;

  const query = useQuery<SellerChartData, Error>({
    queryKey: sellerKeys.chartData(),
    queryFn: sellerApi.getSellerChartData,
    enabled: isAuthenticated && !isAuthLoading && !isDemo,
    staleTime: 60000,
  });

  if (isDemo) {
    return { data: DEMO_CHART_DATA, isLoading: false, isError: false };
  }

  return query;
};

export const useSellerStatistics = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery<SellerStatistics, Error>({
    queryKey: sellerKeys.statistics(),
    queryFn: sellerApi.getSellerStatistics,
    enabled: isAuthenticated && !isAuthLoading,
    refetchInterval: isAuthenticated ? 60000 : false,
    staleTime: 30000,
  });
};
