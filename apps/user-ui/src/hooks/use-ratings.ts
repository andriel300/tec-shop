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
  getProductReviews,
  type Rating,
  type PaginatedReviewsResponse,
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

export const useProductReviews = (
  productId: string,
  page = 1,
  limit = 10,
  sort: 'newest' | 'highest' | 'lowest' = 'newest'
): UseQueryResult<PaginatedReviewsResponse, Error> => {
  return useQuery({
    queryKey: ['productReviews', productId, page, limit, sort],
    queryFn: () => getProductReviews(productId, page, limit, sort),
    enabled: !!productId,
  });
};

export const useCreateOrUpdateRating = (
  productId: string
): UseMutationResult<Rating, Error, FormData> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createOrUpdateRating(productId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRating', productId] });
      queryClient.invalidateQueries({ queryKey: ['productReviews', productId] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRating'] });
      queryClient.invalidateQueries({ queryKey: ['productReviews'] });
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
      queryClient.invalidateQueries({
        queryKey: ['productReviews', variables.productId],
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
