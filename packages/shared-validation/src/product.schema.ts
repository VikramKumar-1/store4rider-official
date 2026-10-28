import { z } from "zod";

export const productImageSchema = z.object({
  id: z.string().nullish(),
  url: z.string().min(1, "Image URL is required"),
  altText: z.string().nullish().default("Product Image"),
  isBase: z.boolean().nullish(),
});

export const productVariantSchema = z.object({
  id: z.string().nullish(),
  sku: z.string().min(1),
  price: z.number().min(0),
  specialPrice: z.number().min(0).nullish(),
  stock: z.number().int().min(0).default(0),
  attributes: z.record(z.any()).default({}),
  imageUrl: z.string().nullish(),
  altText: z.string().nullish(),
  weight: z.number().min(0).nullish(),
  status: z.enum(["enabled", "disabled"]).nullish().default("enabled"),
  visibility: z.string().nullish(),
  images: z.array(productImageSchema).nullish().default([]),
  hsnCode: z.string().nullish(),
});

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  slug: z.string().nullish(),
  description: z.string().default(""),
  shortDescription: z.string().nullish(),
  categoryId: z.string().nullish(),
  categorySlugs: z.array(z.string()).nullish(),
  brand: z.string().nullish(),
  brandId: z.string().nullish(),
  gender: z.string().nullish(),
  productType: z.enum(["simple", "configurable"]).default("simple"),
  basePrice: z.number().min(0),
  specialPrice: z.number().min(0).nullish(),
  specialPriceFromDate: z.union([z.string(), z.date()]).nullish(),
  specialPriceToDate: z.union([z.string(), z.date()]).nullish(),
  mapPrice: z.number().min(0).nullish(),
  msrpPrice: z.number().min(0).nullish(),
  stockStatus: z.number().int().default(1),
  qty: z.number().int().min(0).default(0),
  outOfStockQty: z.number().int().nullish(),
  minCartQty: z.number().int().nullish(),
  maxCartQty: z.number().int().nullish(),
  notifyOnStockBelow: z.number().int().nullish(),
  allowBackorders: z.boolean().nullish().default(false),
  weight: z.number().min(0).nullish(),
  weightUnit: z.enum(["kg", "g", "ml", "L"]).nullish().default("kg"),
  countryOfManufacture: z.string().nullish().default("India"),
  taxClassName: z.string().nullish(),
  hsnCode: z.string().nullish(),
  attributeSetCode: z.string().nullish(),
  visibility: z.string().nullish().default("Catalog, Search"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  showFeaturedBadge: z.boolean().nullish(),
  isFreeShipping: z.boolean().default(false),
  images: z.array(productImageSchema).default([]),
  colorImages: z.record(z.string()).nullish(),
  variants: z.array(productVariantSchema).default([]),
  attributes: z.record(z.any()).nullish().default({}),
  metaTitle: z.string().nullish(),
  metaKeywords: z.string().nullish(),
  metaDescription: z.string().nullish(),
  relatedSkus: z.array(z.string()).nullish().default([]),
  upsellSkus: z.array(z.string()).nullish().default([]),
  crosssellSkus: z.array(z.string()).nullish().default([]),
  tags: z.array(z.string()).nullish().default([]),
  videoUrl: z.string().nullish(),
  sizeChart: z.string().nullish(),
  faqs: z.array(faqSchema).nullish().default([]),
  documents: z.array(z.object({ name: z.string(), url: z.string() })).nullish().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
