import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  logo: z.string().optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true).optional(),
  menuGroup: z.string().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();
