import { z } from 'zod';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductVariantSchema,
  ShippingInfoSchema,
  SEOSchema,
  InventorySchema,
  PricingSchema,
} from '@tec-shop/shared-validation';

// Export Zod schemas for validation
export {
  CreateProductSchema,
  UpdateProductSchema,
  ProductVariantSchema,
  ShippingInfoSchema,
  SEOSchema,
  InventorySchema,
  PricingSchema,
};

// Export inferred types from Zod schemas
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type ProductVariantDto = z.infer<typeof ProductVariantSchema>;
export type ShippingInfoDto = z.infer<typeof ShippingInfoSchema>;
export type SEODto = z.infer<typeof SEOSchema>;
export type InventoryDto = z.infer<typeof InventorySchema>;
export type PricingDto = z.infer<typeof PricingSchema>;

/**
 * Product Response DTO
 * Matches Prisma Product model structure with relations
 */
export interface ProductResponseDto {
  id: string;
  shopId: string;
  name: string;
  description: string;

  // Category & Brand (with relations)
  categoryId: string;
  category?: CategoryResponseDto; // Populated when fetched with relations
  brandId?: string | null;
  brand?: BrandResponseDto | null; // Populated when fetched with relations

  // Product Type
  productType: 'SIMPLE' | 'VARIABLE' | 'DIGITAL';

  // Pricing
  price: number;
  salePrice?: number | null;

  // Stock
  stock: number;

  // Images
  images: string[];

  // Variants
  hasVariants: boolean;
  variants?: ProductVariantResponseDto[];

  // Dynamic fields (Json)
  attributes?: Record<string, unknown> | null;
  shipping?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
  inventory?: Record<string, unknown> | null;

  // Additional fields
  warranty?: string | null;
  tags: string[];
  youtubeUrl?: string | null;
  slug?: string | null;

  // Status
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED';
  publishDate?: Date | null;

  // Flags
  isActive: boolean;
  isFeatured: boolean;

  // Metrics
  views: number;
  sales: number;

  // Soft delete
  deletedAt?: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Variant Response DTO
 * Matches Prisma ProductVariant model structure
 */
export interface ProductVariantResponseDto {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number | null;
  stock: number;
  image?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category Response DTO
 */
export interface CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  children?: CategoryResponseDto[];
  attributes?: Record<string, unknown> | null;
  image?: string | null;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Brand Response DTO
 */
export interface BrandResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Category & Brand DTOs
// ============================================

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  image: z.string().url().optional(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

export const CreateBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters').max(100),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .optional(),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateBrandSchema = CreateBrandSchema.partial();

export type CreateBrandDto = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandDto = z.infer<typeof UpdateBrandSchema>;

// ============================================
// Public Products Query DTO
// ============================================

/**
 * Query parameters for public product listing
 * Used by frontend for marketplace browsing and filtering
 */
export const GetAllProductsQuerySchema = z.object({
  // Taxonomy filters
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  shopId: z.string().optional(),

  // Search
  search: z.string().max(200).optional(),

  // Price range
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),

  // Product type
  productType: z
    .enum(['simple', 'variable', 'digital'])
    .optional()
    .describe('Filter by product type'),

  // Flags
  isFeatured: z
    .boolean()
    .optional()
    .describe('Filter for featured/highlighted products'),

  // Tags
  tags: z
    .array(z.string())
    .optional()
    .describe('Filter by product tags (e.g., new, sale, trending)'),

  // Sort options
  sort: z
    .enum(['newest', 'price-asc', 'price-desc', 'popular', 'top-sales'])
    .default('newest')
    .describe(
      'Sort order: newest (createdAt desc), price-asc, price-desc, popular (views desc), top-sales (sales desc)'
    ),

  // Pagination
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Number of items per page'),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of items to skip'),
});

export type GetAllProductsQueryDto = z.infer<typeof GetAllProductsQuerySchema>;

/**
 * Paginated products response
 * Follows the pagination pattern used in brand/category endpoints
 */
export interface PaginatedProductsResponseDto {
  products: ProductResponseDto[];
  total: number;
  limit: number;
  offset: number;
  sort: string;
}
