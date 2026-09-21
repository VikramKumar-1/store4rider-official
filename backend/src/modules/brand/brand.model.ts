import mongoose, { Schema } from "mongoose";
import { IBrand } from "@store4riders/shared-types";

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BrandModel = mongoose.models.Brand || mongoose.model<IBrand>("Brand", brandSchema);
