import { apiClient } from './client';

// Shop interfaces
export interface Seller {
  id: string;
  authId: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
  isVerified: boolean;
}

export interface Shop {
  id: string;
  sellerId: string;
  seller?: Seller;
  businessName: string;
  bio?: string | null;
  description?: string | null;
  category: string;
  address: string;
  openingHours: string;
  website?: string | null;
  socialLinks: Record<string, unknown>[];
  rating: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shop API functions
export const getShopById = async (shopId: string): Promise<Shop> => {
  const response = await apiClient.get(`/public/shops/${shopId}`);
  return response.data;
};
