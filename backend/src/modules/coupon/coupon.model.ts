import mongoose, { Schema } from "mongoose";
import { ICoupon } from "@store4riders/shared-types";

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);
