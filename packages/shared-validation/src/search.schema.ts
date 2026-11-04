import { z } from "zod";

export const createSearchRedirectSchema = z.object({
  searchTerm: z
    .string()
    .trim()
    .min(1, "Search term cannot be empty")
    .max(120, "Search term cannot exceed 120 characters"),
  redirectUrl: z
    .string()
    .trim()
    .min(1, "Redirect URL cannot be empty")
    .max(500, "Redirect URL cannot exceed 500 characters"),
  targetType: z.enum(["category", "brand", "product", "custom"]).default("category"),
  targetTitle: z.string().trim().max(200).optional().default(""),
  matchType: z.enum(["exact", "contains", "fuzzy"]).default("exact"),
  synonyms: z.array(z.string().trim().min(1).max(120)).optional().default([]),
  isActive: z.boolean().default(true),
});

export const updateSearchRedirectSchema = createSearchRedirectSchema.partial();
