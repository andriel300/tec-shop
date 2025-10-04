'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getSellerDashboard,
  type SellerDashboardData,
} from '../lib/api/seller';

interface UseSellerDashboardReturn {
  dashboard: SellerDashboardData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch seller dashboard data (lightweight version)
 * Use this for dashboard overview and metrics
 *
 * @returns {UseSellerDashboardReturn} Dashboard data with seller and shop summary
 *
 * @example
 * const { dashboard, isLoading } = useSellerDashboard();
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <div>
 *     <h2>Welcome, {dashboard?.seller.name}</h2>
 *     <p>Total Orders: {dashboard?.shop?.totalOrders}</p>
 *   </div>
 * );
 */
const useSellerDashboard = (): UseSellerDashboardReturn => {
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SellerDashboardData, Error>({
    queryKey: ['seller-dashboard'],
    queryFn: getSellerDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes (increased from 2 to reduce API calls)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Disabled - prevents excessive requests
    refetchOnMount: false, // Disabled - only fetch if stale
    refetchOnReconnect: false, // Disabled - prevent refetch on network reconnect
  });

  return {
    dashboard: dashboard ?? null,
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
};

export default useSellerDashboard;
