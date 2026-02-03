import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getShopById,
  getShopFollowersCount,
  checkUserFollowsShop,
  followShop,
  unfollowShop,
  type Shop,
} from '../lib/api/shops';

export const useShop = (
  shopId: string,
  enabled = true
): UseQueryResult<Shop, Error> => {
  return useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getShopById(shopId),
    enabled: enabled && !!shopId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useShopFollowersCount = (
  shopId: string,
  enabled = true
): UseQueryResult<{ count: number }, Error> => {
  return useQuery({
    queryKey: ['shop-followers-count', shopId],
    queryFn: () => getShopFollowersCount(shopId),
    enabled: enabled && !!shopId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCheckShopFollow = (
  shopId: string,
  enabled = true
): UseQueryResult<{ isFollowing: boolean }, Error> => {
  return useQuery({
    queryKey: ['shop-follow-check', shopId],
    queryFn: () => checkUserFollowsShop(shopId),
    enabled: enabled && !!shopId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useFollowShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shopId: string) => followShop(shopId),
    onSuccess: (_data, shopId) => {
      // Invalidate follow-related queries
      queryClient.invalidateQueries({ queryKey: ['shop-follow-check', shopId] });
      queryClient.invalidateQueries({ queryKey: ['shop-followers-count', shopId] });
    },
  });
};

export const useUnfollowShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shopId: string) => unfollowShop(shopId),
    onSuccess: (_data, shopId) => {
      // Invalidate follow-related queries
      queryClient.invalidateQueries({ queryKey: ['shop-follow-check', shopId] });
      queryClient.invalidateQueries({ queryKey: ['shop-followers-count', shopId] });
    },
  });
};
