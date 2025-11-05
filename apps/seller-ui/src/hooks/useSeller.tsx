'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getSellerProfile,
  type SellerProfileResponse,
} from '../lib/api/seller';

interface UseSellerReturn {
  seller: SellerProfileResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage seller profile data
 * Uses TanStack Query for caching and automatic background refetching
 *
 * @returns {UseSellerReturn} Seller data, loading state, error state, and refetch function
 *
 * @example
 * const { seller, isLoading, isError } = useSeller();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (isError) return <div>Error loading seller data</div>;
 *
 * return <h1>{seller?.name}</h1>;
 */
const useSeller = (): UseSellerReturn => {
  const {
    data: seller,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SellerProfileResponse, Error>({
    queryKey: ['seller-profile'],
    queryFn: getSellerProfile,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes (increased from 5)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1, // Reduced from 2 - less aggressive retrying
    refetchOnWindowFocus: false, // Disabled - prevents excessive requests on tab switch
    refetchOnMount: false, // Disabled - only fetch if data is stale, not on every mount
    refetchOnReconnect: false, // Disabled - prevent refetch on network reconnect
  });

  return {
    seller: seller ?? null,
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
};

export default useSeller;
