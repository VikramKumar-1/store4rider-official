import mongoose, { Schema, Document } from "mongoose";
import { ISearchRedirect } from "@store4riders/shared-types";

export interface ISearchRedirectDocument extends Omit<ISearchRedirect, "_id">, Document {}

const searchRedirectSchema = new Schema<ISearchRedirectDocument>(
  {
    searchTerm: { type: String, required: true, trim: true },
    cleanSearchTerm: { type: String, required: true, lowercase: true, trim: true, index: true },
    redirectUrl: { type: String, required: true, trim: true },
    targetType: {
      type: String,
      enum: ["category", "brand", "product", "custom"],
      default: "category",
    },
    targetTitle: { type: String, default: "", trim: true },
    matchType: {
      type: String,
      enum: ["exact", "contains", "fuzzy"],
      default: "exact",
    },
    synonyms: [{ type: String, trim: true }],
    cleanSynonyms: [{ type: String, lowercase: true, trim: true, index: true }],
    isActive: { type: Boolean, default: true, index: true },
    redirectCount: { type: Number, default: 0 },
    lastTriggeredAt: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes for ultra-fast exact and synonym matches
searchRedirectSchema.index({ isActive: 1, cleanSearchTerm: 1 });
searchRedirectSchema.index({ isActive: 1, cleanSynonyms: 1 });

export const SearchRedirectModel =
  mongoose.models.SearchRedirect ||
  mongoose.model<ISearchRedirectDocument>("SearchRedirect", searchRedirectSchema);
