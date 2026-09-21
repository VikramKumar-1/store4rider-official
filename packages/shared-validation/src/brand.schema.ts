import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  logo: z.string().url().optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();
