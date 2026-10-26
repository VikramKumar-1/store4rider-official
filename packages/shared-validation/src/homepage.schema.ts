import { z } from "zod";

export const heroCardSchema = z.object({
  id: z.string().default("card-1"),
  title: z.string().min(1, "Title is required").max(100),
  priceFormatted: z.string().min(1, "Price is required").max(50),
  imageUrl: z.string().min(1, "Image URL is required"),
  ctaText: z.string().default("SHOP NOW"),
  ctaUrl: z.string().default("/products"),
});

export const heroSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().min(1, "Subtitle is required").max(200),
  ctaText: z.string().min(1, "CTA Text is required").max(50),
  ctaLink: z.string().min(1, "CTA Link is required").max(500),
  bgImages: z.array(z.string().min(1)).min(1, "At least one background image is required"),
  featuredCards: z.array(heroCardSchema).max(4).default([]),
});

export const homepageSeoSchema = z.object({
  metaTitle: z.string().min(1, "Meta title is required").max(150),
  metaDescription: z.string().min(1, "Meta description is required").max(350),
  metaKeywords: z.string().max(500).default(""),
  ogTitle: z.string().max(150).optional().default(""),
  ogDescription: z.string().max(350).optional().default(""),
  ogImage: z.string().optional().default(""),
  canonicalUrl: z.string().optional().default(""),
});

export const categoryCardSchema = z.object({
  title: z.string().min(1, "Category title is required").max(100),
  imageUrl: z.string().min(1, "Category image is required"),
  linkUrl: z.string().min(1, "Category link is required").max(500),
});

export const featuredCategoriesSectionSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required").max(100),
  helmets: categoryCardSchema,
  gloves: categoryCardSchema,
  jackets: categoryCardSchema,
});

export const browseProductItemSchema = z.object({
  id: z.string().optional().default("prod-1"),
  name: z.string().max(200).default(""),
  priceFormatted: z.string().max(50).default(""),
  imageUrl: z.string().default(""),
  category: z.string().max(100).optional().default("RIDING GEAR"),
  productUrl: z.string().max(500).default("/products"),
  rating: z.number().optional().default(4.8),
});

export const browseCategoriesSectionSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required").max(100),
  items: z.array(browseProductItemSchema).max(16).optional().default([]),
});

export const touringGearSectionSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required").max(100),
  seeMoreText: z.string().min(1, "Button text is required").max(50),
  seeMoreLink: z.string().min(1, "Button link is required").max(500),
});

export const socialMediaBannerTopSchema = z.object({
  imageUrl: z.string().optional().default(""),
  linkUrl: z.string().max(500).optional().default(""),
  title: z.string().max(150).optional().default(""),
  subtitle: z.string().max(150).optional().default(""),
  description: z.string().max(500).optional().default(""),
  buttonText: z.string().max(50).optional().default(""),
  imagePosition: z.enum(["top", "center", "bottom"]).optional().default("top"),
});

export const socialMediaBannerBottomSchema = z.object({
  imageUrl: z.string().optional().default(""),
  linkUrl: z.string().max(500).optional().default(""),
  title: z.string().max(150).optional().default(""),
  subtitle: z.string().max(150).optional().default(""),
  description: z.string().max(500).optional().default(""),
  buttonText: z.string().max(50).optional().default(""),
  imagePosition: z.enum(["top", "center", "bottom"]).optional().default("top"),
});

export const instagramReelSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  title: z.string().max(300).optional().default(""),
  thumbnailUrl: z.string().min(1, "Thumbnail is required"),
  videoType: z.enum(["upload", "embed"]).default("embed"),
  videoUrl: z.string().default(""),
  instagramUrl: z.string().optional().default("https://www.instagram.com/store4riders/"),
  views: z.string().max(50).optional().default(""),
  likes: z.string().max(50).optional().default(""),
  author: z.string().max(100).optional().default("@store4riders"),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
  timestamp: z.string().optional().default(""),
});

export const socialMediaSectionSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required").max(100),
  sectionSubtitle: z.string().max(300).optional().default("Catch our latest rides, gear reviews, and track days in action."),
  instagramHandle: z.string().max(100).optional().default("store4riders"),
  instagramProfileUrl: z.string().max(500).optional().default("https://www.instagram.com/store4riders/"),
  followersCount: z.string().max(50).optional().default("48.5K"),
  followingCount: z.string().max(50).optional().default("142"),
  postsCount: z.string().max(50).optional().default("1,280"),
  profileAvatarUrl: z.string().optional().default(""),
  reels: z.array(instagramReelSchema).optional().default([]),
  reelImages: z.array(z.string()).default([]),
  bannerTop: socialMediaBannerTopSchema.optional().default({ imageUrl: "", linkUrl: "" }),
  bannerBottom: socialMediaBannerBottomSchema.optional().default({ imageUrl: "", linkUrl: "", title: "", subtitle: "", description: "" }),
  lastSyncedAt: z.string().optional().default(""),
});

export const testimonialsSectionSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required").max(100),
});

export const topBannerSchema = z.object({
  message: z.string().max(200).default(""),
  highlightText: z.string().max(100).default(""),
  isEnabled: z.boolean().default(true),
  linkUrl: z.string().max(500).optional().default(""),
});

export const homepageSectionsSchema = z.object({
  topBanner: topBannerSchema,
  featuredCategories: featuredCategoriesSectionSchema,
  browseCategories: browseCategoriesSectionSchema,
  touringGear: touringGearSectionSchema,
  socialMedia: socialMediaSectionSchema,
  testimonials: testimonialsSectionSchema,
});

export const updateHeroAndSeoSchema = z.object({
  hero: heroSectionSchema,
  seo: homepageSeoSchema,
});

export const updateHomepageSectionsSchema = z.object({
  sections: homepageSectionsSchema,
});

export const updateHomepageConfigSchema = z.object({
  hero: heroSectionSchema.optional(),
  seo: homepageSeoSchema.optional(),
  sections: homepageSectionsSchema.optional(),
});
