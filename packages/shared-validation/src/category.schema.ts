import { z } from "zod";

import { faqSchema } from "./product.schema";

export const specFieldDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  placeholder: z.string().optional().or(z.literal("")),
  presets: z.array(z.string()).optional().default([]),
});

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  faqs: z.array(faqSchema).optional().default([]),
  parentId: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional().or(z.literal("")),
  bannerImage: z.string().optional().or(z.literal("")),
  metaTitle: z.string().max(100).optional().or(z.literal("")),
  metaDescription: z.string().max(500).optional().or(z.literal("")),
  metaKeywords: z.string().max(500).optional().or(z.literal("")),
  videoUrl: z.string().optional().or(z.literal("")),
  includeInMenu: z.boolean().optional().default(true),
  menuGroup: z.string().optional().or(z.literal("")),
  heroCategoryIds: z.array(z.string()).optional().default([]),
  badge: z.string().optional().or(z.literal("")),
  badgeColor: z.string().optional().or(z.literal("")),
  attributeSetCode: z.string().optional().or(z.literal("")),
  hsnCode: z.string().optional().or(z.literal("")),
  taxClassName: z.string().optional().or(z.literal("")),
  weightUnit: z.enum(["kg", "g", "ml", "L"]).optional(),
  sizeChart: z.string().optional().or(z.literal("")),
  specDefinitions: z.array(specFieldDefinitionSchema).optional().default([]),
});

export const updateCategorySchema = createCategorySchema.partial();
