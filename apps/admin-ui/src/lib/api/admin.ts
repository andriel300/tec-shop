import { apiClient } from './client';

// ============ Types and Interfaces ============

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  status?: 'ACTIVE' | 'BANNED';
}

export interface BanUserData {
  reason: string;
  duration?: number; // Duration in days, 0 = permanent
}

export interface CreateAdminData {
  email: string;
  name: string;
  password: string;
}

export interface ListSellersParams {
  page?: number;
  limit?: number;
  search?: string;
  isVerified?: boolean;
}

export interface UpdateSellerVerificationData {
  isVerified: boolean;
  note?: string;
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  startDate?: string;
  endDate?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  userType: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  isEmailVerified: boolean;
  isBanned: boolean;
  banReason?: string;
  bannedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminResponse {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerWithShopResponse {
  id: string;
  authId: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    businessName: string;
    category: string;
    isActive: boolean;
    rating: number;
    totalOrders: number;
  };
  auth?: {
    email: string;
    isEmailVerified: boolean;
    createdAt: string;
  };
}

export interface OrderResponse {
  id: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  totalAmount: number;
  discountAmount: number;
  platformFee: number;
  finalAmount: number;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  payouts: Array<{
    id: string;
    sellerId: string;
    amount: number;
    status: string;
  }>;
}

export interface PlatformStatistics {
  users: {
    total: number;
    customers: number;
    sellers: number;
    admins: number;
  };
  sellers: {
    verified: number;
    activeShops: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
  };
  revenue: {
    total: number;
    platformFee: number;
  };
}

// ============ User Management API Functions ============

export const listUsers = async (
  params: ListUsersParams = {}
): Promise<PaginatedResponse<UserResponse>> => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

export const getUserDetails = async (userId: string): Promise<UserResponse & { profile?: Record<string, unknown> }> => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

export const banUser = async (
  userId: string,
  data: BanUserData
): Promise<UserResponse> => {
  const response = await apiClient.post(`/admin/users/${userId}/ban`, data);
  return response.data;
};

export const unbanUser = async (userId: string): Promise<UserResponse> => {
  const response = await apiClient.post(`/admin/users/${userId}/unban`);
  return response.data;
};

// ============ Admin Team Management API Functions ============

export const listAdmins = async (): Promise<AdminResponse[]> => {
  const response = await apiClient.get('/admin/admins');
  return response.data;
};

export const createAdmin = async (
  data: CreateAdminData
): Promise<AdminResponse> => {
  const response = await apiClient.post('/admin/admins', data);
  return response.data;
};

export const deleteAdmin = async (
  adminId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/admin/admins/${adminId}`);
  return response.data;
};

// ============ Seller Management API Functions ============

export const listSellers = async (
  params: ListSellersParams = {}
): Promise<PaginatedResponse<SellerWithShopResponse>> => {
  const response = await apiClient.get('/admin/sellers', { params });
  return response.data;
};

export const updateSellerVerification = async (
  sellerId: string,
  data: UpdateSellerVerificationData
): Promise<SellerWithShopResponse> => {
  const response = await apiClient.put(
    `/admin/sellers/${sellerId}/verification`,
    data
  );
  return response.data;
};

// ============ Order Management API Functions ============

export const listAllOrders = async (
  params: ListOrdersParams = {}
): Promise<PaginatedResponse<OrderResponse>> => {
  const response = await apiClient.get('/admin/orders', { params });
  return response.data;
};

// ============ Statistics API Functions ============

export const getPlatformStatistics = async (): Promise<PlatformStatistics> => {
  const response = await apiClient.get('/admin/statistics');
  return response.data;
};
