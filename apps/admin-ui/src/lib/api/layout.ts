import { apiClient } from './client';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  actionUrl: string | null;
  actionLabel: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutResponse {
  id: string;
  logo: string | null;
  banner: string | null;
  heroSlides?: HeroSlide[];
  updatedAt: string;
  createdAt: string;
}

export interface UpdateLayoutData {
  logo?: string;
  banner?: string;
}

export interface CreateHeroSlideData {
  title: string;
  subtitle?: string;
  imageUrl: string;
  actionUrl?: string;
  actionLabel?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateHeroSlideData {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  order?: number;
  isActive?: boolean;
}

export const getLayout = async (): Promise<{ layout: LayoutResponse }> => {
  const response = await apiClient.get('/admin/layout');
  return response.data;
};

export const updateLayout = async (
  data: UpdateLayoutData
): Promise<{ layout: LayoutResponse }> => {
  const response = await apiClient.put('/admin/layout', data);
  return response.data;
};

export const createHeroSlide = async (
  data: CreateHeroSlideData
): Promise<HeroSlide> => {
  const response = await apiClient.post('/admin/layout/hero-slides', data);
  return response.data;
};

export const updateHeroSlide = async (
  id: string,
  data: UpdateHeroSlideData
): Promise<HeroSlide> => {
  const response = await apiClient.put(`/admin/layout/hero-slides/${id}`, data);
  return response.data;
};

export const deleteHeroSlide = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/admin/layout/hero-slides/${id}`);
  return response.data;
};

export const reorderHeroSlides = async (
  slideIds: string[]
): Promise<{ message: string }> => {
  const response = await apiClient.put('/admin/layout/hero-slides/reorder', {
    slideIds,
  });
  return response.data;
};
