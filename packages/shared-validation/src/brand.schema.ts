import { z } from "zod";

export const brandFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  aliases: z.array(z.string()).optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  faqs: z.array(brandFaqSchema).optional(),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true).optional(),
  menuGroup: z.string().optional(),
  metaTitle: z.string().max(300).optional().or(z.literal("")),
  metaDescription: z.string().max(2000).optional().or(z.literal("")),
  metaKeywords: z.string().max(2000).optional().or(z.literal("")),
});

export const updateBrandSchema = createBrandSchema.partial();
