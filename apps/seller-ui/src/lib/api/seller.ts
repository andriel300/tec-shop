import { apiClient } from './client';

export interface CreateShopData {
  businessName: string;
  bio: string;
  category: string;
  address: string;
  openingHours: string;
  website?: string;
}

export interface UpdateShopData {
  businessName?: string;
  bio?: string;
  category?: string;
  address?: string;
  openingHours?: string;
  website?: string;
}

export interface CreateSellerProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
}

export interface ShopResponse {
  id: string;
  sellerId: string;
  businessName: string;
  bio?: string;
  category: string;
  address: string;
  openingHours: string;
  website?: string;
  rating: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfileResponse {
  id: string;
  authId: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
  isVerified: boolean;
  shop?: ShopResponse;
  createdAt: string;
  updatedAt: string;
}

export interface SellerDashboardData {
  seller: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
    createdAt: string;
  };
  shop: {
    id: string;
    businessName: string;
    category: string;
    rating: number;
    totalOrders: number;
    isActive: boolean;
    createdAt: string;
  } | null;
}

export interface StripeOnboardingResponse {
  url: string;
  expires_at: number;
}

export interface StripeAccountStatus {
  status: 'NOT_STARTED' | 'PENDING' | 'INCOMPLETE' | 'COMPLETE' | 'RESTRICTED' | 'REJECTED';
  canAcceptPayments: boolean;
  requiresAction: boolean;
  requirements: string[];
  accountId?: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
}

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

// Seller API functions
export const createShop = async (shopData: CreateShopData): Promise<ShopResponse> => {
  const response = await apiClient.post('/seller/shop/create', shopData);
  return response.data;
};

export const updateShop = async (shopData: UpdateShopData): Promise<ShopResponse> => {
  const response = await apiClient.post('/seller/shop', shopData);
  return response.data;
};

export const getSellerProfile = async (): Promise<SellerProfileResponse> => {
  const response = await apiClient.get('/seller/profile');
  return response.data;
};

export const updateSellerProfile = async (
  profileData: Partial<CreateSellerProfileData>
): Promise<SellerProfileResponse> => {
  const response = await apiClient.put('/seller/profile', profileData);
  return response.data;
};

export const getShop = async (): Promise<ShopResponse | null> => {
  try {
    const response = await apiClient.get('/seller/shop');
    return response.data;
  } catch (error: unknown) {
    // If shop doesn't exist, API returns 404, which is expected
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
};

export const getSellerDashboard = async (): Promise<SellerDashboardData> => {
  const response = await apiClient.get('/seller/dashboard');
  return response.data;
};

// Stripe Connect API functions
export const createStripeOnboardingLink = async (): Promise<StripeOnboardingResponse> => {
  const response = await apiClient.post('/seller/stripe/onboard');
  return response.data;
};

export const getStripeAccountStatus = async (): Promise<StripeAccountStatus> => {
  const response = await apiClient.get('/seller/stripe/status');
  return response.data;
};