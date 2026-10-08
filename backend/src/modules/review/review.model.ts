import mongoose, { Schema } from "mongoose";
import { IReview, IStoreReview } from "@store4riders/shared-types";

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);

const storeReviewSchema = new Schema<IStoreReview>(
  {
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true },
    text: { type: String, required: true },
    link: { type: String },
    avatarUrl: { type: String },
    source: { type: String, default: "google" },
    externalId: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const StoreReviewModel =
  mongoose.models.StoreReview || mongoose.model<IStoreReview>("StoreReview", storeReviewSchema);
