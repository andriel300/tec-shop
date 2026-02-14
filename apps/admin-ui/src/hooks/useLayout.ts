import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getLayout,
  updateLayout,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  type UpdateLayoutData,
  type CreateHeroSlideData,
  type UpdateHeroSlideData,
} from '../lib/api/layout';

export const layoutKeys = {
  all: ['layout'] as const,
};

export const heroSlideKeys = {
  all: ['heroSlides'] as const,
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

export const useHeroSlides = () => {
  const { data: layout, isLoading, error } = useLayout();

  return {
    data: layout?.heroSlides ?? [],
    isLoading,
    error,
  };
};

export const useCreateHeroSlide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHeroSlideData) => createHeroSlide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: layoutKeys.all });
      queryClient.invalidateQueries({ queryKey: heroSlideKeys.all });
      toast.success('Hero slide created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create hero slide');
    },
  });
};

export const useUpdateHeroSlide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHeroSlideData }) =>
      updateHeroSlide(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: layoutKeys.all });
      queryClient.invalidateQueries({ queryKey: heroSlideKeys.all });
      toast.success('Hero slide updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update hero slide');
    },
  });
};

export const useDeleteHeroSlide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHeroSlide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: layoutKeys.all });
      queryClient.invalidateQueries({ queryKey: heroSlideKeys.all });
      toast.success('Hero slide deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete hero slide');
    },
  });
};

export const useReorderHeroSlides = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slideIds: string[]) => reorderHeroSlides(slideIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: layoutKeys.all });
      queryClient.invalidateQueries({ queryKey: heroSlideKeys.all });
      toast.success('Hero slides reordered successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder hero slides');
    },
  });
};
