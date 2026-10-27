import mongoose, { Schema } from "mongoose";
import { IBlogPost, IBlogCategory } from "@store4riders/shared-types";

const blogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    description: { type: String, default: "" },
    articleCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
  },
  { timestamps: true }
);

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: "" },
    featuredImage: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    categoryId: { type: String, ref: "BlogCategory", default: "" },
    categoryName: { type: String, default: "" },
    categorySlug: { type: String, default: "", index: true },
    tags: { type: [String], default: [], index: true },
    author: {
      name: { type: String, default: "Store4Riders Team" },
      url: { type: String, default: "" },
      jobTitle: { type: String, default: "" },
      avatar: { type: String, default: "" },
      bio: { type: String, default: "" },
      sameAs: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },
    publishedAt: { type: Date, default: Date.now, index: true },
    readingTimeMinutes: { type: Number, default: 1 },
    wordCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
  },
  { timestamps: true }
);

// Full text search index
blogPostSchema.index({ title: "text", excerpt: "text", tags: "text" });

export const BlogCategoryModel =
  mongoose.models.BlogCategory || mongoose.model<IBlogCategory>("BlogCategory", blogCategorySchema);

export const BlogPostModel =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
