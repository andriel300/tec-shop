import { apiClient } from './client';

// Product interfaces matching backend DTOs
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number | null;
  stock: number;
  image?: string | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  categoryId: string;
  category?: Category;
  brandId?: string | null;
  brand?: Brand | null;
  productType: 'SIMPLE' | 'VARIABLE' | 'DIGITAL';
  price: number;
  salePrice?: number | null;
  stock: number;
  images: string[];
  hasVariants: boolean;
  variants?: ProductVariant[];
  tags: string[];
  slug?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED';
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  sales: number;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetProductsParams {
  categoryId?: string;
  brandId?: string;
  shopId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  productType?: 'simple' | 'variable' | 'digital';
  isFeatured?: boolean;
  onSale?: boolean;
  tags?: string[];
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'top-sales';
  limit?: number;
  offset?: number;
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  sort: string;
}

// Products API functions
export const getPublicProducts = async (
  params?: GetProductsParams
): Promise<PaginatedProductsResponse> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array parameters (like tags)
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
  }

  const response = await apiClient.get(
    `/public/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  );
  return response.data;
};

export const getFeaturedProducts = async (
  limit = 10
): Promise<PaginatedProductsResponse> => {
  return getPublicProducts({
    isFeatured: true,
    limit,
    sort: 'popular',
  });
};

export const getProductsByCategory = async (
  categoryId: string,
  params?: Omit<GetProductsParams, 'categoryId'>
): Promise<PaginatedProductsResponse> => {
  return getPublicProducts({
    categoryId,
    ...params,
  });
};

export const getProductsByBrand = async (
  brandId: string,
  params?: Omit<GetProductsParams, 'brandId'>
): Promise<PaginatedProductsResponse> => {
  return getPublicProducts({
    brandId,
    ...params,
  });
};

export const searchProducts = async (
  search: string,
  params?: Omit<GetProductsParams, 'search'>
): Promise<PaginatedProductsResponse> => {
  return getPublicProducts({
    search,
    ...params,
  });
};

// ============================================
// Product Ratings
// ============================================

export interface Rating {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  images: string[];
  reviewerName?: string | null;
  reviewerAvatar?: string | null;
  sellerResponse?: string | null;
  sellerResponseAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReviewsResponse {
  reviews: Rating[];
  total: number;
  page: number;
  limit: number;
  averageRating: number;
  ratingCount: number;
  ratingDistribution: Record<string, number>;
}

export interface CreateRatingDto {
  rating: number;
  title?: string;
  content?: string;
}

export interface UpdateRatingDto {
  rating: number;
}

export const createOrUpdateRating = async (
  productId: string,
  formData: FormData
): Promise<Rating> => {
  const response = await apiClient.post(
    `/products/${productId}/ratings`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const updateRating = async (
  ratingId: string,
  rating: number
): Promise<Rating> => {
  const response = await apiClient.put(`/products/ratings/${ratingId}`, {
    rating,
  });
  return response.data;
};

export const deleteRating = async (ratingId: string): Promise<void> => {
  await apiClient.delete(`/products/ratings/${ratingId}`);
};

export const getUserRating = async (
  productId: string
): Promise<Rating | null> => {
  const response = await apiClient.get(`/products/${productId}/ratings/me`);
  return response.data;
};

export const getProductReviews = async (
  productId: string,
  page = 1,
  limit = 10,
  sort: 'newest' | 'highest' | 'lowest' = 'newest'
): Promise<PaginatedReviewsResponse> => {
  const response = await apiClient.get(
    `/public/products/reviews/${productId}?page=${page}&limit=${limit}&sort=${sort}`
  );
  return response.data;
};
