import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().min(1, "Alt text is required for SEO & accessibility"),
});

export const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1),
  price: z.number().min(0),
  specialPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  attributes: z.record(z.string()).default({}),
  imageUrl: z.string().optional(),
  weight: z.number().min(0).optional(),
  status: z.enum(["enabled", "disabled"]).optional().default("enabled"),
  visibility: z.string().optional(),
  images: z.array(productImageSchema).optional().default([]),
  hsnCode: z.string().optional(),
});

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().default(""),
  shortDescription: z.string().optional(),
  categoryId: z.string().optional(),
  categorySlugs: z.array(z.string()).optional(),
  brand: z.string().optional(),
  brandId: z.string().optional(),
  gender: z.string().optional(),
  productType: z.enum(["simple", "configurable"]).default("simple"),
  basePrice: z.number().min(0),
  specialPrice: z.number().min(0).optional(),
  specialPriceFromDate: z.union([z.string(), z.date()]).optional(),
  specialPriceToDate: z.union([z.string(), z.date()]).optional(),
  mapPrice: z.number().min(0).optional(),
  msrpPrice: z.number().min(0).optional(),
  stockStatus: z.number().int().default(1),
  qty: z.number().int().min(0).default(0),
  outOfStockQty: z.number().int().optional(),
  minCartQty: z.number().int().optional(),
  maxCartQty: z.number().int().optional(),
  notifyOnStockBelow: z.number().int().optional(),
  allowBackorders: z.boolean().optional().default(false),
  weight: z.number().min(0).optional(),
  countryOfManufacture: z.string().optional(),
  taxClassName: z.string().optional(),
  hsnCode: z.string().optional(),
  attributeSetCode: z.string().optional(),
  visibility: z.string().optional().default("Catalog, Search"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  isFreeShipping: z.boolean().default(false),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  attributes: z.record(z.string()).optional().default({}),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
  relatedSkus: z.array(z.string()).optional().default([]),
  upsellSkus: z.array(z.string()).optional().default([]) ,
  crosssellSkus: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  videoUrl: z.string().optional(),
  sizeChart: z.string().optional(),
  faqs: z.array(faqSchema).optional().default([]),
  documents: z.array(z.object({ name: z.string(), url: z.string() })).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
