import { z } from 'zod';

/**
 * Product Variant Schema
 * For products with multiple options (size, color, etc.)
 */
export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  attributes: z.record(z.string(), z.string()), // { size: 'M', color: 'Red' }
  price: z.number().positive('Price must be positive'),
  salePrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Shipping Information Schema
 */
export const ShippingInfoSchema = z.object({
  weight: z.number().positive('Weight must be positive'), // in kg
  dimensions: z.object({
    length: z.number().positive('Length must be positive'), // in cm
    width: z.number().positive('Width must be positive'),
    height: z.number().positive('Height must be positive'),
  }),
  freeShipping: z.boolean().default(false),
  shippingClass: z.enum(['standard', 'express', 'fragile', 'heavy']).default('standard'),
});

/**
 * SEO Schema
 */
export const SEOSchema = z.object({
  title: z.string().max(60, 'SEO title should be max 60 characters').optional(),
  description: z.string().max(160, 'SEO description should be max 160 characters').optional(),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  keywords: z.array(z.string()).max(10, 'Max 10 keywords').optional(),
});

/**
 * Pricing Schema
 */
export const PricingSchema = z.object({
  regularPrice: z.number().positive('Regular price must be positive'),
  salePrice: z.number().positive().optional(),
  saleStartDate: z.date().optional(),
  saleEndDate: z.date().optional(),
  taxable: z.boolean().default(true),
  taxClass: z.enum(['standard', 'reduced', 'zero']).default('standard'),
}).refine(
  (data) => {
    if (data.salePrice && data.regularPrice) {
      return data.salePrice < data.regularPrice;
    }
    return true;
  },
  { message: 'Sale price must be less than regular price', path: ['salePrice'] }
).refine(
  (data) => {
    if (data.saleStartDate && data.saleEndDate) {
      return data.saleStartDate < data.saleEndDate;
    }
    return true;
  },
  { message: 'Sale start date must be before end date', path: ['saleEndDate'] }
);

/**
 * Inventory Schema
 */
export const InventorySchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  trackInventory: z.boolean().default(true),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  allowBackorders: z.boolean().default(false),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'on_backorder']).default('in_stock'),
});

/**
 * Create Product Schema
 * Complete validation for product creation
 */
export const CreateProductSchema = z.object({
  // Basic Information
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must be less than 200 characters'),

  description: z.string()
    .min(50, 'Product description must be at least 50 words (approximately 250 characters)')
    .max(1000, 'Product description should not exceed 200 words (approximately 1000 characters)'),

  // Category & Brand
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().min(1, 'Brand is required').optional(),

  // Pricing (simplified for products without variants)
  price: z.number().positive('Price must be greater than 0'),
  salePrice: z.number().positive().optional(),

  // Stock (for simple products)
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),

  // Images
  images: z.array(z.string())
    .min(1, 'At least one product image is required')
    .max(10, 'Maximum 10 images allowed'),

  // Product Type
  productType: z.enum(['simple', 'variable', 'digital']).default('simple'),

  // Variants (for variable products)
  variants: z.array(ProductVariantSchema).optional(),
  hasVariants: z.boolean().default(false),

  // Dynamic Attributes (category-specific)
  attributes: z.record(z.string(), z.any()).optional(),

  // Shipping Information
  shipping: ShippingInfoSchema.optional(),

  // SEO
  seo: SEOSchema.optional(),

  // Inventory
  inventory: InventorySchema.optional(),

  // Additional Fields
  warranty: z.string().max(500).optional(), // e.g., "1 year manufacturer warranty"
  tags: z.array(z.string()).max(20, 'Maximum 20 tags').default([]),

  // Status
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  visibility: z.enum(['public', 'private', 'password_protected']).default('public'),
  publishDate: z.date().optional(),

  // Flags
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // If product has variants, it must be type 'variable'
    if (data.hasVariants && data.productType !== 'variable') {
      return false;
    }
    return true;
  },
  { message: 'Product with variants must be of type "variable"', path: ['productType'] }
).refine(
  (data) => {
    // Variable products must have at least one variant
    if (data.productType === 'variable' && (!data.variants || data.variants.length === 0)) {
      return false;
    }
    return true;
  },
  { message: 'Variable products must have at least one variant', path: ['variants'] }
);

/**
 * Update Product Schema
 * Partial version for updates
 */
export const UpdateProductSchema = CreateProductSchema.partial();

/**
 * TypeScript Types
 * Inferred from Zod schemas
 */
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ShippingInfo = z.infer<typeof ShippingInfoSchema>;
export type SEO = z.infer<typeof SEOSchema>;
export type Pricing = z.infer<typeof PricingSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
