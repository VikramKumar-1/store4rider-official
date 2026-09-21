import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  bannerImage: z.string().url().optional().or(z.literal("")),
  metaTitle: z.string().max(100).optional().or(z.literal("")),
  metaDescription: z.string().max(500).optional().or(z.literal("")),
  metaKeywords: z.string().max(500).optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
});

export const updateCategorySchema = createCategorySchema.partial();
