import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getLayout,
  updateLayout,
  type UpdateLayoutData,
} from '../lib/api/layout';

export const layoutKeys = {
  all: ['layout'] as const,
};

export const useLayout = () => {
  return useQuery({
    queryKey: layoutKeys.all,
    queryFn: async () => {
      const response = await getLayout();
      return response.layout;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateLayoutData) => updateLayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: layoutKeys.all });
      toast.success('Layout updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update layout');
    },
  });
};
