import { z } from "zod";

export const createBlogCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(120).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateBlogCategorySchema = createBlogCategorySchema.partial();

export const blogAuthorSchema = z.object({
  name: z.string().min(2).max(100).default("Store4Riders Team"),
  url: z.string().optional().or(z.literal("")),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
  avatar: z.string().optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  sameAs: z.array(z.string()).optional().default([]),
});

export const createBlogPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(250),
  slug: z.string().min(3).max(250).optional().or(z.literal("")),
  content: z.string().min(10, "Content must have at least 10 characters"),
  excerpt: z.string().max(600).optional().or(z.literal("")),
  featuredImage: z.string().optional().or(z.literal("")),
  videoUrl: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  categoryName: z.string().optional().or(z.literal("")),
  categorySlug: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
  author: blogAuthorSchema.optional(),
  status: z.enum(["draft", "published"]).default("published"),
  publishedAt: z.union([z.string(), z.date()]).optional(),
  readingTimeMinutes: z.number().int().optional(),
  wordCount: z.number().int().optional(),
  metaTitle: z.string().max(100).optional().or(z.literal("")),
  metaDescription: z.string().max(500).optional().or(z.literal("")),
  metaKeywords: z.string().max(500).optional().or(z.literal("")),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const blogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(["all", "draft", "published"]).optional().default("published"),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
  sortBy: z.enum(["publishedAt", "createdAt", "views", "title"]).optional().default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
