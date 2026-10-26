import mongoose, { Schema } from "mongoose";
import { ICategory } from "@store4riders/shared-types";

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    parentId: { type: String },
    description: { type: String },
    image: { type: String },
    bannerImage: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    videoUrl: { type: String },
    includeInMenu: { type: Boolean, default: true },
    menuGroup: { type: String },
    heroCategoryIds: [{ type: String }],
    badge: { type: String },
    badgeColor: { type: String },
    attributeSetCode: { type: String },
    hsnCode: { type: String },
    taxClassName: { type: String },
    weightUnit: { type: String, enum: ["kg", "g", "ml", "L"] },
    sizeChart: { type: String },
    specDefinitions: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        placeholder: { type: String, default: "" },
        presets: [{ type: String }],
      },
    ],
    filterConfig: [{
      code: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, enum: ["checkbox", "swatch", "range"], default: "checkbox" },
      sortOrder: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    }],
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);
