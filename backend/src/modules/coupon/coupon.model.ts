import mongoose, { Schema } from "mongoose";
import { ICoupon } from "@store4riders/shared-types";

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountCap: { type: Number, min: 0 },
    minPurchase: { type: Number, required: true, default: 0, min: 0 },
    startDate: { type: Date },
    expiryDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    scope: { type: String, enum: ["all", "category", "brand", "product"], default: "all", index: true },
    applicableCategories: [{ type: String }],
    applicableBrands: [{ type: String }],
    applicableProducts: [{ type: String }],
    excludeSaleItems: { type: Boolean, default: false },
    firstOrderOnly: { type: Boolean, default: false },
    usageLimitPerUser: { type: Number, default: 1, min: 1 },
    totalUsageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);
