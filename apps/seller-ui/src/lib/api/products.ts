import apiClient from './client';

export interface CreateProductData {
  name: string;
  description: string;
  categoryId: string;
  brandId?: string;
  productType?: 'simple' | 'variable' | 'digital';
  price: number;
  salePrice?: number;
  stock: number;
  images: File[];
  hasVariants?: boolean;
  variants?: unknown[];
  attributes?: Record<string, unknown>;
  shipping?: unknown;
  seo?: unknown;
  inventory?: unknown;
  warranty?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'scheduled';
  visibility?: 'public' | 'private' | 'password_protected';
  publishDate?: Date;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface ProductResponse {
  id: string;
  shopId: string;
  name: string;
  description: string;
  categoryId: string;
  brandId?: string | null;
  productType: 'SIMPLE' | 'VARIABLE' | 'DIGITAL';
  price: number;
  salePrice?: number | null;
  stock: number;
  images: string[];
  hasVariants: boolean;
  variants?: unknown[];
  attributes?: Record<string, unknown> | null;
  shipping?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
  inventory?: Record<string, unknown> | null;
  warranty?: string | null;
  tags: string[];
  slug?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED';
  publishDate?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  sales: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new product with images
 */
export const createProduct = async (productData: CreateProductData): Promise<ProductResponse> => {
  const formData = new FormData();

  // Append basic product fields
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('categoryId', productData.categoryId);
  if (productData.brandId) formData.append('brandId', productData.brandId);
  if (productData.productType) formData.append('productType', productData.productType);
  formData.append('price', productData.price.toString());
  if (productData.salePrice) formData.append('salePrice', productData.salePrice.toString());
  formData.append('stock', productData.stock.toString());

  // Append variant data
  if (productData.hasVariants !== undefined) formData.append('hasVariants', productData.hasVariants.toString());
  if (productData.variants) formData.append('variants', JSON.stringify(productData.variants));

  // Append dynamic fields
  if (productData.attributes) formData.append('attributes', JSON.stringify(productData.attributes));
  if (productData.shipping) formData.append('shipping', JSON.stringify(productData.shipping));
  if (productData.seo) formData.append('seo', JSON.stringify(productData.seo));
  if (productData.inventory) formData.append('inventory', JSON.stringify(productData.inventory));

  // Append additional fields
  if (productData.warranty) formData.append('warranty', productData.warranty);
  if (productData.tags) formData.append('tags', JSON.stringify(productData.tags));
  if (productData.status) formData.append('status', productData.status);
  if (productData.visibility) formData.append('visibility', productData.visibility);
  if (productData.publishDate) formData.append('publishDate', productData.publishDate.toISOString());
  if (productData.isFeatured !== undefined) formData.append('isFeatured', productData.isFeatured.toString());
  if (productData.isActive !== undefined) formData.append('isActive', productData.isActive.toString());

  // Append images
  productData.images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await apiClient.post('/seller/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Get all products for the seller's shop
 */
export const getProducts = async (filters?: {
  categoryId?: string;
  brandId?: string;
  productType?: string;
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}): Promise<ProductResponse[]> => {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append('categoryId', filters.categoryId);
  if (filters?.brandId) params.append('brandId', filters.brandId);
  if (filters?.productType) params.append('productType', filters.productType);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.isFeatured !== undefined) params.append('isFeatured', String(filters.isFeatured));
  if (filters?.search) params.append('search', filters.search);

  const response = await apiClient.get(`/seller/products?${params.toString()}`);
  return response.data;
};

/**
 * Get a single product by ID
 */
export const getProduct = async (id: string): Promise<ProductResponse> => {
  const response = await apiClient.get(`/seller/products/${id}`);
  return response.data;
};

/**
 * Update a product
 */
export const updateProduct = async (
  id: string,
  productData: Partial<CreateProductData>
): Promise<ProductResponse> => {
  const formData = new FormData();

  // Append updated fields
  if (productData.name) formData.append('name', productData.name);
  if (productData.description) formData.append('description', productData.description);
  if (productData.categoryId) formData.append('categoryId', productData.categoryId);
  if (productData.brandId) formData.append('brandId', productData.brandId);
  if (productData.productType) formData.append('productType', productData.productType);
  if (productData.price !== undefined) formData.append('price', productData.price.toString());
  if (productData.salePrice) formData.append('salePrice', productData.salePrice.toString());
  if (productData.stock !== undefined) formData.append('stock', productData.stock.toString());

  // Append variant data
  if (productData.hasVariants !== undefined) formData.append('hasVariants', productData.hasVariants.toString());
  if (productData.variants) formData.append('variants', JSON.stringify(productData.variants));

  // Append dynamic fields
  if (productData.attributes) formData.append('attributes', JSON.stringify(productData.attributes));
  if (productData.shipping) formData.append('shipping', JSON.stringify(productData.shipping));
  if (productData.seo) formData.append('seo', JSON.stringify(productData.seo));
  if (productData.inventory) formData.append('inventory', JSON.stringify(productData.inventory));

  // Append additional fields
  if (productData.warranty) formData.append('warranty', productData.warranty);
  if (productData.tags) formData.append('tags', JSON.stringify(productData.tags));
  if (productData.status) formData.append('status', productData.status);
  if (productData.visibility) formData.append('visibility', productData.visibility);
  if (productData.publishDate) formData.append('publishDate', productData.publishDate.toISOString());
  if (productData.isFeatured !== undefined) formData.append('isFeatured', productData.isFeatured.toString());
  if (productData.isActive !== undefined) formData.append('isActive', productData.isActive.toString());

  // Append new images if provided
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const response = await apiClient.put(`/seller/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  await apiClient.delete(`/seller/products/${id}`);
};
