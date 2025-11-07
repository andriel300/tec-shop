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
