'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getSellerProfile,
  type SellerProfileResponse,
} from '../lib/api/seller';
import { useAuth } from '../contexts/auth-context';

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
 * Only fetches when user is authenticated to prevent unnecessary API errors
 */
const useSeller = (): UseSellerReturn => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const {
    data: seller,
    isLoading: isQueryLoading,
    isError,
    error,
    refetch,
  } = useQuery<SellerProfileResponse, Error>({
    queryKey: ['seller-profile'],
    queryFn: getSellerProfile,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    seller: seller ?? null,
    isLoading: isAuthLoading || isQueryLoading,
    isError,
    error: error ?? null,
    refetch,
  };
};

export default useSeller;
