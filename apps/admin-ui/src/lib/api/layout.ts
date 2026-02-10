import { apiClient } from './client';

export interface LayoutResponse {
  id: string;
  logo: string | null;
  banner: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface UpdateLayoutData {
  logo?: string;
  banner?: string;
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
