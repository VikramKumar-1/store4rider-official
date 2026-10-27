import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  logo: z.string().optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true).optional(),
  menuGroup: z.string().optional(),
  metaTitle: z.string().max(120).optional().or(z.literal("")),
  metaDescription: z.string().max(500).optional().or(z.literal("")),
  metaKeywords: z.string().max(500).optional().or(z.literal("")),
});

export const updateBrandSchema = createBrandSchema.partial();
