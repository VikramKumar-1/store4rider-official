import mongoose, { Schema } from "mongoose";
import { IProduct } from "@store4riders/shared-types";

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    categoryId: { type: String, index: true },
    basePrice: { type: Number, required: true },
    specialPrice: { type: Number },
    specialPriceFromDate: { type: Date },
    specialPriceToDate: { type: Date },
    weight: { type: Number },
    stockStatus: { type: Number },
    allowBackorders: { type: Boolean, default: false },
    productType: { type: String },
    taxClassName: { type: String },
    magentoCategories: { type: String },
    categorySlugs: [{ type: String, index: true }],
    configurableVariations: { type: String },
    shortDescription: { type: String },
    metaTitle: { type: String },
    metaKeywords: { type: String },
    metaDescription: { type: String },
    relatedSkus: [{ type: String }],
    upsellSkus: [{ type: String }],
    crosssellSkus: [{ type: String }],
    brand: { type: String },
    gender: { type: String },
    attributes: { type: Map, of: String, default: new Map() },
    countryOfManufacture: { type: String },
    attributeSetCode: { type: String },
    configurableVariationLabels: { type: String },
    qty: { type: Number, default: 0 },
    sizeChart: { type: String },
    size_chart: { type: String },
    isFreeShipping: { type: Boolean, default: false },
    images: [
      {
        id: { type: String },
        url: { type: String, required: true },
        altText: { type: String },
      },
    ],
    colorImages: { type: Map, of: String },
    variants: [
      {
        id: { type: String },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        specialPrice: { type: Number },
        stock: { type: Number, default: 0 },
        attributes: { type: Map, of: String },
        imageUrl: { type: String },
      },
    ],
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
    videoUrl: { type: String },
    documents: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    salesCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// High-performance query and sorting indexes
productSchema.index({ brand: 1 });
productSchema.index({ basePrice: 1, _id: -1 });
productSchema.index({ basePrice: -1, _id: -1 });
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ salesCount: -1, _id: -1 });
productSchema.index({ avgRating: -1, _id: -1 });

// Wildcard index for dynamic attribute filtering
// This allows efficient queries on attributes.* fields
productSchema.index({ "attributes.helmet_type": 1 });
productSchema.index({ "attributes.material": 1 });
productSchema.index({ "attributes.riding_style": 1 });
productSchema.index({ "attributes.certification": 1 });

// Prevent Mongoose from re-compiling the model during Next.js hot reloads
export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
