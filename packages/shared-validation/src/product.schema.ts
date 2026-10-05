import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
});

export const productVariantSchema = z.object({
  sku: z.string().min(3),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  attributes: z.record(z.string()),
});

export const faqSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
});

export const createProductSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(10000), // increased length for HTML
  faqs: z.array(faqSchema).optional().default([]),
  categoryId: z.string(),
  basePrice: z.number().min(0),
  specialPrice: z.number().min(0).optional(),
  specialPriceFromDate: z.union([z.string().datetime(), z.date()]).optional(),
  specialPriceToDate: z.union([z.string().datetime(), z.date()]).optional(),
  weight: z.number().min(0).optional(),
  allowBackorders: z.boolean().optional().default(false),
  taxClassName: z.string().optional(),
  images: z.array(productImageSchema).min(1),
  variants: z.array(productVariantSchema).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  videoUrl: z.string().url().optional(),
  documents: z.array(z.object({ name: z.string(), url: z.string().url() })).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
