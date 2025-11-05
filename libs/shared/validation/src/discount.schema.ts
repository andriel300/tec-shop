import { z } from 'zod';

/**
 * Discount Type Enum
 */
export const DiscountTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']);
export type DiscountType = z.infer<typeof DiscountTypeEnum>;

/**
 * Create Discount Schema
 */
export const CreateDiscountSchema = z
  .object({
    // Seller ID
    sellerId: z.string().min(1, 'Seller ID is required'),

    // Basic info
    publicName: z
      .string()
      .min(3, 'Public name must be at least 3 characters')
      .max(100, 'Public name must be less than 100 characters'),

    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(50, 'Code must be less than 50 characters')
      .regex(
        /^[A-Z0-9_-]+$/,
        'Code can only contain uppercase letters, numbers, hyphens, and underscores'
      )
      .transform((val) => val.toUpperCase()), // Auto-uppercase

    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .optional(),

    // Discount configuration
    discountType: DiscountTypeEnum,
    discountValue: z
      .number()
      .positive('Discount value must be greater than 0'),

    // Usage limits
    usageLimit: z
      .number()
      .int()
      .positive('Usage limit must be a positive integer')
      .optional(),

    maxUsesPerCustomer: z
      .number()
      .int()
      .positive('Max uses per customer must be a positive integer')
      .optional(),

    // Validity period
    startDate: z.coerce.date().optional(), // coerce allows string dates
    endDate: z.coerce.date().optional(),

    // Conditions
    minimumPurchase: z
      .number()
      .positive('Minimum purchase must be greater than 0')
      .optional(),

    // Status
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Percentage discount cannot exceed 100%
      if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100%',
      path: ['discountValue'],
    }
  )
  .refine(
    (data) => {
      // End date must be after start date
      if (data.startDate && data.endDate && data.endDate <= data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

/**
 * Update Discount Schema
 * Partial version of Create schema (without refinements)
 */
const BaseDiscountSchema = z.object({
  sellerId: z.string().min(1, 'Seller ID is required'),
  publicName: z
    .string()
    .min(3, 'Public name must be at least 3 characters')
    .max(100, 'Public name must be less than 100 characters'),
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be less than 50 characters')
    .regex(
      /^[A-Z0-9_-]+$/,
      'Code can only contain uppercase letters, numbers, hyphens, and underscores'
    )
    .transform((val) => val.toUpperCase()),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  discountType: DiscountTypeEnum,
  discountValue: z.number().positive('Discount value must be greater than 0'),
  usageLimit: z
    .number()
    .int()
    .positive('Usage limit must be a positive integer')
    .optional(),
  maxUsesPerCustomer: z
    .number()
    .int()
    .positive('Max uses per customer must be a positive integer')
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minimumPurchase: z
    .number()
    .positive('Minimum purchase must be greater than 0')
    .optional(),
  isActive: z.boolean().default(true),
});

export const UpdateDiscountSchema = BaseDiscountSchema.partial().omit({
  sellerId: true, // Cannot change seller
});

/**
 * Validate Discount Code Schema
 * For customers applying discount codes
 */
export const ValidateDiscountCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Discount code is required')
    .transform((val) => val.toUpperCase()),
  orderValue: z.number().positive('Order value must be greater than 0'),
});

/**
 * TypeScript Types
 */
export type CreateDiscountInput = z.infer<typeof CreateDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof UpdateDiscountSchema>;
export type ValidateDiscountCodeInput = z.infer<typeof ValidateDiscountCodeSchema>;
