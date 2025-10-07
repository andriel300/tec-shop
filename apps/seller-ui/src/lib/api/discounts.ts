import apiClient from './client';

/**
 * Discount Type Enum
 * Matches backend DiscountType from Prisma schema
 */
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

/**
 * Create Discount Request Data
 * Used when creating a new discount code
 */
export interface CreateDiscountData {
  publicName: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  usageLimit?: number;
  maxUsesPerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  minimumPurchase?: number;
  isActive?: boolean;
}

/**
 * Update Discount Request Data
 * All fields optional for partial updates
 */
export interface UpdateDiscountData {
  publicName?: string;
  code?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  usageLimit?: number;
  maxUsesPerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  minimumPurchase?: number;
  isActive?: boolean;
}

/**
 * Discount Response from Backend
 * Matches DiscountCodeResponse interface from backend
 */
export interface DiscountResponse {
  id: string;
  sellerId: string;
  publicName: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  usageLimit?: number | null;
  usageCount: number;
  maxUsesPerCustomer?: number | null;
  startDate: string; // ISO date string from backend
  endDate?: string | null; // ISO date string from backend
  minimumPurchase?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Get all discount codes for the authenticated seller
 */
export const getDiscounts = async (): Promise<DiscountResponse[]> => {
  const response = await apiClient.get('/seller/discounts');
  return response.data;
};

/**
 * Get a single discount code by ID
 */
export const getDiscount = async (id: string): Promise<DiscountResponse> => {
  const response = await apiClient.get(`/seller/discounts/${id}`);
  return response.data;
};

/**
 * Create a new discount code
 */
export const createDiscount = async (
  discountData: CreateDiscountData
): Promise<DiscountResponse> => {
  // Send dates as-is (Date objects) - backend expects Date instances
  const response = await apiClient.post('/seller/discounts', discountData);
  return response.data;
};

/**
 * Update an existing discount code
 */
export const updateDiscount = async (
  id: string,
  discountData: UpdateDiscountData
): Promise<DiscountResponse> => {
  // Convert dates to ISO strings for backend
  const payload = {
    ...discountData,
    startDate: discountData.startDate?.toISOString(),
    endDate: discountData.endDate?.toISOString(),
  };

  const response = await apiClient.put(`/seller/discounts/${id}`, payload);
  return response.data;
};

/**
 * Delete a discount code
 */
export const deleteDiscount = async (id: string): Promise<void> => {
  await apiClient.delete(`/seller/discounts/${id}`);
};
