import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getUserRating,
  createOrUpdateRating,
  updateRating as updateRatingApi,
  deleteRating as deleteRatingApi,
  type Rating,
} from '../lib/api/products';

export const useUserRating = (
  productId: string,
  enabled = true
): UseQueryResult<Rating | null, Error> => {
  return useQuery({
    queryKey: ['userRating', productId],
    queryFn: () => getUserRating(productId),
    enabled,
  });
};

export const useCreateOrUpdateRating = (
  productId: string
): UseMutationResult<Rating, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rating: number) => createOrUpdateRating(productId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRating', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateRating = (): UseMutationResult<
  Rating,
  Error,
  { ratingId: string; rating: number }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ratingId, rating }) => updateRatingApi(ratingId, rating),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userRating'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteRating = (): UseMutationResult<
  void,
  Error,
  { ratingId: string; productId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ratingId }) => deleteRatingApi(ratingId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['userRating', variables.productId],
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
