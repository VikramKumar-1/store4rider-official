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
  imageUrl: z.string().min(1, "Image is required"),
  linkUrl: z.string().min(1, "Link is required").max(500),
});

export const socialMediaBannerBottomSchema = z.object({
  imageUrl: z.string().min(1, "Image is required"),
  linkUrl: z.string().min(1, "Link is required").max(500),
  title: z.string().default("New Arrivals"),
  subtitle: z.string().default("Explore Now"),
  description: z.string().default("Check out the latest riding gear and premium accessories."),
});

export const socialMediaSectionSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required").max(100),
  reelImages: z.array(z.string().min(1)).default([]),
  bannerTop: socialMediaBannerTopSchema,
  bannerBottom: socialMediaBannerBottomSchema,
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
