import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as adminApi from '../lib/api/admin';

/**
 * Query Keys for TanStack Query
 * Centralized keys prevent typos and make invalidation easier
 */
export const adminKeys = {
  // User Management
  users: {
    all: ['admin', 'users'] as const,
    lists: () => [...adminKeys.users.all, 'list'] as const,
    list: (filters?: adminApi.ListUsersParams) => [...adminKeys.users.lists(), filters] as const,
    details: () => [...adminKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...adminKeys.users.details(), id] as const,
  },
  // Admin Team
  admins: {
    all: ['admin', 'admins'] as const,
    list: () => [...adminKeys.admins.all, 'list'] as const,
  },
  // Sellers
  sellers: {
    all: ['admin', 'sellers'] as const,
    lists: () => [...adminKeys.sellers.all, 'list'] as const,
    list: (filters?: adminApi.ListSellersParams) => [...adminKeys.sellers.lists(), filters] as const,
  },
  // Orders
  orders: {
    all: ['admin', 'orders'] as const,
    lists: () => [...adminKeys.orders.all, 'list'] as const,
    list: (filters?: adminApi.ListOrdersParams) => [...adminKeys.orders.lists(), filters] as const,
  },
  // Statistics
  statistics: ['admin', 'statistics'] as const,
};

// ============ User Management Hooks ============

/**
 * Hook: Fetch all users with pagination and filters
 */
export function useUsers(params?: adminApi.ListUsersParams) {
  return useQuery({
    queryKey: adminKeys.users.list(params),
    queryFn: () => adminApi.listUsers(params),
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
}

/**
 * Hook: Fetch single user details
 */
export function useUserDetails(userId: string) {
  return useQuery({
    queryKey: adminKeys.users.detail(userId),
    queryFn: () => adminApi.getUserDetails(userId),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Hook: Ban a user
 */
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: adminApi.BanUserData }) =>
      adminApi.banUser(userId, data),
    onSuccess: (_data, variables) => {
      toast.success('User banned successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.detail(variables.userId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to ban user');
    },
  });
}

/**
 * Hook: Unban a user
 */
export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: (_data, userId) => {
      toast.success('User unbanned successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.detail(userId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unban user');
    },
  });
}

// ============ Admin Team Management Hooks ============

/**
 * Hook: Fetch all admins
 */
export function useAdmins() {
  return useQuery({
    queryKey: adminKeys.admins.list(),
    queryFn: adminApi.listAdmins,
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
  });
}

/**
 * Hook: Create a new admin
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: adminApi.CreateAdminData) => adminApi.createAdmin(data),
    onSuccess: () => {
      toast.success('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.admins.list() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create admin');
    },
  });
}

/**
 * Hook: Delete an admin
 */
export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId: string) => adminApi.deleteAdmin(adminId),
    onSuccess: () => {
      toast.success('Admin deleted successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.admins.list() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete admin');
    },
  });
}

// ============ Seller Management Hooks ============

/**
 * Hook: Fetch all sellers with pagination and filters
 */
export function useSellers(params?: adminApi.ListSellersParams) {
  return useQuery({
    queryKey: adminKeys.sellers.list(params),
    queryFn: () => adminApi.listSellers(params),
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
}

/**
 * Hook: Update seller verification status
 */
export function useUpdateSellerVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sellerId,
      data,
    }: {
      sellerId: string;
      data: adminApi.UpdateSellerVerificationData;
    }) => adminApi.updateSellerVerification(sellerId, data),
    onSuccess: () => {
      toast.success('Seller verification status updated');
      queryClient.invalidateQueries({ queryKey: adminKeys.sellers.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update seller verification');
    },
  });
}

// ============ Order Management Hooks ============

/**
 * Hook: Fetch all platform orders with filters
 */
export function useAllOrders(params?: adminApi.ListOrdersParams) {
  return useQuery({
    queryKey: adminKeys.orders.list(params),
    queryFn: () => adminApi.listAllOrders(params),
    staleTime: 30 * 1000, // Data is fresh for 30 seconds (orders change frequently)
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
}

// ============ Statistics Hooks ============

/**
 * Hook: Fetch platform-wide statistics
 */
export function usePlatformStatistics() {
  return useQuery({
    queryKey: adminKeys.statistics,
    queryFn: adminApi.getPlatformStatistics,
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every minute for live updates
  });
}

// ============ Recommendation Hooks ============

/**
 * Hook: Trigger recommendation model training
 */
export function useTrainRecommendationModel() {
  return useMutation({
    mutationFn: adminApi.trainRecommendationModel,
    onSuccess: (data) => {
      toast.success(
        `Model trained successfully: ${data.interactions} interactions from ${data.users} users across ${data.products} products`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to train recommendation model');
    },
  });
}
