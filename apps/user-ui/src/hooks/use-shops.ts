import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getShopById, type Shop } from '../lib/api/shops';

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
