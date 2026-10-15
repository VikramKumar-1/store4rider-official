/**
 * @file homepage.model.ts
 * @description Mongoose schema and model definition for Homepage Configuration.
 * Holds Hero, SEO, and All Sections settings editable from the Admin panel.
 */
import mongoose, { Schema } from "mongoose";
import { IHomepageConfig } from "@store4riders/shared-types";

const heroCardSchema = new Schema(
  {
    id: { type: String, default: "card-1" },
    title: { type: String, required: true },
    priceFormatted: { type: String, required: true },
    imageUrl: { type: String, required: true },
    ctaText: { type: String, default: "SHOP NOW" },
    ctaUrl: { type: String, default: "/products" },
  },
  { _id: false }
);

const heroSectionSchema = new Schema(
  {
    title: { type: String, default: "RIDING GEAR THAT KEEPS YOU SAFE" },
    subtitle: { type: String, default: "BROWSE THE COLLECTION" },
    ctaText: { type: String, default: "Shop Now" },
    ctaLink: { type: String, default: "/products" },
    bgImages: {
      type: [String],
      default: ["/heropic1.jpg", "/heropic2.jpg"],
    },
    featuredCards: {
      type: [heroCardSchema],
      default: [
        {
          id: "prod-1",
          title: "Riding Armor Jacket",
          priceFormatted: "₹ 5,499",
          imageUrl: "/no-image.svg",
          ctaText: "SHOP NOW",
          ctaUrl: "/products/riding-armor-jacket",
        },
        {
          id: "prod-2",
          title: "Protective Rider Suit",
          priceFormatted: "₹ 12,999",
          imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80",
          ctaText: "SHOP NOW",
          ctaUrl: "/products/protective-rider-suit",
        },
      ],
    },
  },
  { _id: false }
);

const homepageSeoSchema = new Schema(
  {
    metaTitle: {
      type: String,
      default: "Store4Riders | Premium Motorcycle Riding Gear & Accessories",
    },
    metaDescription: {
      type: String,
      default: "Shop certified motorcycle helmets, riding jackets, pants, boots, and safety gear in India. Genuine products, best prices & express delivery at Store4Riders.",
    },
    metaKeywords: {
      type: String,
      default: "motorcycle helmets, riding gear, riding jackets, riding boots, bike accessories, store4riders",
    },
    ogTitle: { type: String, default: "Store4Riders | Premium Motorcycle Riding Gear & Accessories" },
    ogDescription: { type: String, default: "Shop certified motorcycle helmets, riding jackets, pants, boots, and safety gear in India." },
    ogImage: { type: String, default: "/Store4riders-Logo.jpg" },
    canonicalUrl: { type: String, default: "https://store4riders.com" },
  },
  { _id: false }
);

const categoryCardSchema = new Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, required: true },
  },
  { _id: false }
);

const topBannerSchema = new Schema(
  {
    message: { type: String, default: "Discount 20% For New Member," },
    highlightText: { type: String, default: "ONLY FOR TODAY!!" },
    isEnabled: { type: Boolean, default: true },
    linkUrl: { type: String, default: "/products" },
  },
  { _id: false }
);

const featuredCategoriesSectionSchema = new Schema(
  {
    sectionTitle: { type: String, default: "SHOP BY CATEGORY" },
    helmets: {
      type: categoryCardSchema,
      default: {
        title: "HELMETS",
        imageUrl: "/helmetcat.jpg",
        linkUrl: "/motorcycle-helmets",
      },
    },
    gloves: {
      type: categoryCardSchema,
      default: {
        title: "GLOVES",
        imageUrl: "/glovescat.jpg",
        linkUrl: "/riding-gear/riding-gloves",
      },
    },
    jackets: {
      type: categoryCardSchema,
      default: {
        title: "JACKETS",
        imageUrl: "/jacketcat.jpg",
        linkUrl: "/jackets",
      },
    },
  },
  { _id: false }
);

const browseProductItemSchema = new Schema(
  {
    id: { type: String, default: "item-1" },
    name: { type: String, default: "" },
    priceFormatted: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    category: { type: String, default: "RIDING GEAR" },
    productUrl: { type: String, default: "/products" },
    rating: { type: Number, default: 4.8 },
  },
  { _id: false }
);

const browseCategoriesSectionSchema = new Schema(
  {
    sectionTitle: { type: String, default: "BROWSE RIDING GEAR CATEGORIES" },
    items: {
      type: [browseProductItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const touringGearSectionSchema = new Schema(
  {
    sectionTitle: { type: String, default: "BEST GEAR FOR TOURING" },
    seeMoreText: { type: String, default: "SEE MORE" },
    seeMoreLink: { type: String, default: "/products?q=touring" },
  },
  { _id: false }
);

const socialMediaSectionSchema = new Schema(
  {
    sectionTitle: { type: String, default: "INSTA REELS" },
    reelImages: {
      type: [String],
      default: [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=400&h=600&q=80",
      ],
    },
    bannerTop: {
      imageUrl: {
        type: String,
        default: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
      },
      linkUrl: { type: String, default: "/products" },
    },
    bannerBottom: {
      imageUrl: {
        type: String,
        default: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
      },
      linkUrl: { type: String, default: "/products" },
      title: { type: String, default: "New Arrivals" },
      subtitle: { type: String, default: "Explore Now" },
      description: {
        type: String,
        default: "Check out the latest riding gear and premium accessories designed for your next adventure.",
      },
    },
  },
  { _id: false }
);

const testimonialsSectionSchema = new Schema(
  {
    sectionTitle: { type: String, default: "WHAT CUSTOMERS SAY ABOUT US" },
  },
  { _id: false }
);

const homepageSectionsSchema = new Schema(
  {
    topBanner: { type: topBannerSchema, default: () => ({}) },
    featuredCategories: { type: featuredCategoriesSectionSchema, default: () => ({}) },
    browseCategories: { type: browseCategoriesSectionSchema, default: () => ({}) },
    touringGear: { type: touringGearSectionSchema, default: () => ({}) },
    socialMedia: { type: socialMediaSectionSchema, default: () => ({}) },
    testimonials: { type: testimonialsSectionSchema, default: () => ({}) },
  },
  { _id: false }
);

const homepageSchema = new Schema<IHomepageConfig>(
  {
    hero: { type: heroSectionSchema, default: () => ({}) },
    seo: { type: homepageSeoSchema, default: () => ({}) },
    sections: { type: homepageSectionsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const HomepageModel =
  mongoose.models.Homepage || mongoose.model<IHomepageConfig>("Homepage", homepageSchema);
