import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(30, "Coupon code cannot exceed 30 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Coupon code can only contain letters, numbers, hyphens, and underscores")
    .transform((val) => val.toUpperCase().trim()),
  description: z.string().max(255).optional(),
  discountType: z.enum(["percent", "fixed"], {
    errorMap: () => ({ message: "Discount type must be either 'percent' or 'fixed'" }),
  }),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  maxDiscountCap: z.number().positive("Max discount cap must be greater than 0").optional().nullable(),
  minPurchase: z.number().min(0, "Min purchase cannot be negative").default(0),
  startDate: z.string().optional().nullable(),
  expiryDate: z.string({ required_error: "Expiry date is required" }),
  isActive: z.boolean().default(true),
  scope: z.enum(["all", "category", "brand", "product"]).default("all"),
  applicableCategories: z.array(z.string()).optional(),
  applicableBrands: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  excludeSaleItems: z.boolean().default(false),
  firstOrderOnly: z.boolean().default(false),
  usageLimitPerUser: z.number().int().min(1, "Limit per user must be at least 1").default(1),
  totalUsageLimit: z.number().int().min(1, "Total usage limit must be at least 1").optional().nullable(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").transform((val) => val.toUpperCase().trim()),
  cartTotal: z.number().min(0).optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});
