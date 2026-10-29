import mongoose, { Schema } from "mongoose";
import { IBrand } from "@store4riders/shared-types";

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    aliases: [{ type: String }],
    logo: { type: String },
    description: { type: String },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
    showInMenu: { type: Boolean, default: true },
    menuGroup: { type: String, default: "Featured Brands" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
  },
  { timestamps: true }
);

brandSchema.index({ aliases: 1 });

export const BrandModel = mongoose.models.Brand || mongoose.model<IBrand>("Brand", brandSchema);
