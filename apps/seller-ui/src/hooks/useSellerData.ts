import { useQuery } from '@tanstack/react-query';
import * as sellerApi from '../lib/api/seller';
import type { SellerStatistics } from '../lib/api/seller';
import { useAuth } from '../contexts/auth-context';

// Query keys
export const sellerKeys = {
  all: ['seller'] as const,
  statistics: () => [...sellerKeys.all, 'statistics'] as const,
};

// Hooks
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
