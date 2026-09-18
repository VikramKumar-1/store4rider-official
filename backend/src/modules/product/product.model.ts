import mongoose, { Schema } from "mongoose";
import { IProduct } from "@store4riders/shared-types";

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    categoryId: { type: String, index: true },
    basePrice: { type: Number, required: true },
    specialPrice: { type: Number },
    weight: { type: Number },
    stockStatus: { type: Number },
    productType: { type: String },
    magentoCategories: { type: String },
    configurableVariations: { type: String },
    shortDescription: { type: String },
    metaTitle: { type: String },
    metaKeywords: { type: String },
    metaDescription: { type: String },
    relatedSkus: [{ type: String }],
    upsellSkus: [{ type: String }],
    brand: { type: String },
    images: [
      {
        id: { type: String },
        url: { type: String, required: true },
        altText: { type: String },
      },
    ],
    variants: [
      {
        id: { type: String },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: Number, required: true },
        attributes: { type: Map, of: String },
      },
    ],
  },
  { timestamps: true }
);

// High-performance query and sorting indexes
productSchema.index({ brand: 1 });
productSchema.index({ basePrice: 1, _id: -1 });
productSchema.index({ basePrice: -1, _id: -1 });
productSchema.index({ createdAt: -1, _id: -1 });

// Prevent Mongoose from re-compiling the model during Next.js hot reloads
export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
