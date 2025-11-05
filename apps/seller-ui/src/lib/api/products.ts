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
  youtubeUrl?: string;
  discountCodeId?: string; // Optional discount code attached to product
  status?: 'draft' | 'published' | 'scheduled';
  visibility?: 'public' | 'private' | 'password_protected';
  publishDate?: Date;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  image?: string | null;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  isActive: boolean;
}

export interface ProductResponse {
  id: string;
  shopId: string;
  name: string;
  description: string;
  categoryId: string;
  category?: Category; // Populated when fetched with relations
  brandId?: string | null;
  brand?: Brand | null; // Populated when fetched with relations
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
  youtubeUrl?: string | null;
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
export const createProduct = async (
  productData: CreateProductData
): Promise<ProductResponse> => {
  const formData = new FormData();

  // Append basic product fields
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('categoryId', productData.categoryId);
  if (productData.brandId) formData.append('brandId', productData.brandId);
  if (productData.productType)
    formData.append('productType', productData.productType);
  formData.append('price', productData.price.toString());
  if (productData.salePrice)
    formData.append('salePrice', productData.salePrice.toString());
  formData.append('stock', productData.stock.toString());

  // Append variant data
  if (productData.hasVariants !== undefined)
    formData.append('hasVariants', productData.hasVariants.toString());
  if (productData.variants)
    formData.append('variants', JSON.stringify(productData.variants));

  // Append dynamic fields
  if (productData.attributes)
    formData.append('attributes', JSON.stringify(productData.attributes));
  if (productData.shipping)
    formData.append('shipping', JSON.stringify(productData.shipping));
  if (productData.seo) formData.append('seo', JSON.stringify(productData.seo));
  if (productData.inventory)
    formData.append('inventory', JSON.stringify(productData.inventory));

  // Append additional fields
  if (productData.warranty) formData.append('warranty', productData.warranty);
  if (productData.tags)
    formData.append('tags', JSON.stringify(productData.tags));
  if (productData.youtubeUrl)
    formData.append('youtubeUrl', productData.youtubeUrl);
  if (productData.discountCodeId)
    formData.append('discountCodeId', productData.discountCodeId);
  if (productData.status) formData.append('status', productData.status);
  if (productData.visibility)
    formData.append('visibility', productData.visibility);
  if (productData.publishDate)
    formData.append('publishDate', productData.publishDate.toISOString());
  if (productData.isFeatured !== undefined)
    formData.append('isFeatured', productData.isFeatured.toString());
  if (productData.isActive !== undefined)
    formData.append('isActive', productData.isActive.toString());

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
  if (filters?.isActive !== undefined)
    params.append('isActive', String(filters.isActive));
  if (filters?.isFeatured !== undefined)
    params.append('isFeatured', String(filters.isFeatured));
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

export interface UpdateProductData {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  productType?: 'simple' | 'variable' | 'digital';
  price?: number;
  salePrice?: number;
  stock?: number;
  hasVariants?: boolean;
  variants?: unknown[];
  attributes?: Record<string, unknown>;
  shipping?: unknown;
  seo?: unknown;
  inventory?: unknown;
  warranty?: string;
  tags?: string[];
  youtubeUrl?: string;
  discountCodeId?: string;
  status?: 'draft' | 'published' | 'scheduled';
  visibility?: 'public' | 'private' | 'password_protected';
  publishDate?: Date;
  isFeatured?: boolean;
  isActive?: boolean;
  imageUrls?: string[]; // Existing ImageKit URLs to keep
  newImages?: File[]; // New files to upload
}

/**
 * Update a product
 * Since we use eager upload, all images are already URLs by submit time
 * So we can use JSON instead of FormData for cleaner type handling
 */
export const updateProduct = async (
  id: string,
  productData: UpdateProductData
): Promise<ProductResponse> => {
  // Since we use eager upload, newImages should always be empty or undefined
  // All images are already uploaded to ImageKit and exist as URLs in imageUrls

  // Build clean JSON payload
  const payload: Record<string, unknown> = {};

  // Add all defined fields
  if (productData.name !== undefined) payload.name = productData.name;
  if (productData.description !== undefined) payload.description = productData.description;
  if (productData.categoryId !== undefined) payload.categoryId = productData.categoryId;
  if (productData.brandId !== undefined) payload.brandId = productData.brandId;
  if (productData.productType !== undefined) payload.productType = productData.productType;
  if (productData.price !== undefined) payload.price = productData.price;
  if (productData.salePrice !== undefined) payload.salePrice = productData.salePrice;
  if (productData.stock !== undefined) payload.stock = productData.stock;
  if (productData.hasVariants !== undefined) payload.hasVariants = productData.hasVariants;
  if (productData.variants !== undefined) payload.variants = productData.variants;
  if (productData.attributes !== undefined) payload.attributes = productData.attributes;
  if (productData.shipping !== undefined) payload.shipping = productData.shipping;
  if (productData.seo !== undefined) payload.seo = productData.seo;
  if (productData.inventory !== undefined) payload.inventory = productData.inventory;
  if (productData.warranty !== undefined) payload.warranty = productData.warranty;
  if (productData.tags !== undefined) payload.tags = productData.tags;
  if (productData.youtubeUrl !== undefined) payload.youtubeUrl = productData.youtubeUrl;
  if (productData.discountCodeId !== undefined) payload.discountCodeId = productData.discountCodeId;
  if (productData.status !== undefined) payload.status = productData.status;
  if (productData.visibility !== undefined) payload.visibility = productData.visibility;
  if (productData.publishDate !== undefined) payload.publishDate = productData.publishDate;
  if (productData.isFeatured !== undefined) payload.isFeatured = productData.isFeatured;
  if (productData.isActive !== undefined) payload.isActive = productData.isActive;

  // Add image URLs if provided (all images are already uploaded via eager upload)
  if (productData.imageUrls !== undefined && productData.imageUrls.length > 0) {
    payload.images = productData.imageUrls;
  }

  const response = await apiClient.put(`/seller/products/${id}`, payload, {
    headers: {
      'Content-Type': 'application/json',
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

/**
 * Get deleted products (trash) for the seller's shop
 */
export const getDeletedProducts = async (filters?: {
  category?: string;
  search?: string;
}): Promise<ProductResponse[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);

  const response = await apiClient.get(`/seller/products/trash?${params.toString()}`);
  return response.data;
};

/**
 * Restore a deleted product
 */
export const restoreProduct = async (id: string): Promise<ProductResponse> => {
  const response = await apiClient.post(`/seller/products/${id}/restore`);
  return response.data;
};
