import { useQuery } from '@tanstack/react-query';
import * as sellerApi from '../lib/api/seller';
import type { SellerStatistics } from '../lib/api/seller';

// Query keys
export const sellerKeys = {
  all: ['seller'] as const,
  statistics: () => [...sellerKeys.all, 'statistics'] as const,
};

// Hooks
export const useSellerStatistics = () => {
  return useQuery<SellerStatistics, Error>({
    queryKey: sellerKeys.statistics(),
    queryFn: sellerApi.getSellerStatistics,
    refetchInterval: 60000, // Auto-refetch every minute for live data
    staleTime: 30000, // 30 seconds
  });
};
