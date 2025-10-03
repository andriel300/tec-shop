import apiClient from './client';

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: File[];
}

export interface ProductResponse {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  slug: string | null;
  tags: string[];
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

  // Append product fields
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('price', productData.price.toString());
  formData.append('stock', productData.stock.toString());
  formData.append('category', productData.category);

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
  category?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}): Promise<ProductResponse[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.isFeatured !== undefined) params.append('isFeatured', String(filters.isFeatured));

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
  if (productData.price !== undefined) formData.append('price', productData.price.toString());
  if (productData.stock !== undefined) formData.append('stock', productData.stock.toString());
  if (productData.category) formData.append('category', productData.category);

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
