'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getSellerDashboard,
  type SellerDashboardData,
} from '../lib/api/seller';
import { useAuth } from '../contexts/auth-context';

interface UseSellerDashboardReturn {
  dashboard: SellerDashboardData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch seller dashboard data (lightweight version)
 * Only fetches when user is authenticated to prevent unnecessary API errors
 */
const useSellerDashboard = (): UseSellerDashboardReturn => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const {
    data: dashboard,
    isLoading: isQueryLoading,
    isError,
    error,
    refetch,
  } = useQuery<SellerDashboardData, Error>({
    queryKey: ['seller-dashboard'],
    queryFn: getSellerDashboard,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    dashboard: dashboard ?? null,
    isLoading: isAuthLoading || isQueryLoading,
    isError,
    error: error ?? null,
    refetch,
  };
};

export default useSellerDashboard;
