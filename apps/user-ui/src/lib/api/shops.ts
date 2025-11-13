import { apiClient } from './client';

// Shop interfaces
export interface Seller {
  id: string;
  name: string;
  country: string;
  isVerified: boolean;
}

export interface Shop {
  id: string;
  businessName: string;
  bio?: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  logo?: string;
  rating?: number;
  totalRatings?: number;
  isActive?: boolean;
  seller?: Seller;
}

export interface GetShopsParams {
  search?: string;
  category?: string;
  country?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedShopsResponse {
  shops: Shop[];
  total: number;
  limit: number;
  offset: number;
}

// Shop API functions
export const getPublicShops = async (
  params?: GetShopsParams
): Promise<PaginatedShopsResponse> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get(
    `/public/shops${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  );
  return response.data;
};

export const getTopShops = async (
  limit = 10
): Promise<PaginatedShopsResponse> => {
  return getPublicShops({
    minRating: 4,
    limit,
  });
};

export const getShopById = async (shopId: string): Promise<Shop> => {
  const response = await apiClient.get(`/public/shops/${shopId}`);
  return response.data;
};
