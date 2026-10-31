export type CouponScope = "all" | "category" | "brand" | "product";

export interface ICoupon {
  _id?: string;
  id?: string;
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscountCap?: number;
  minPurchase: number;
  startDate?: Date | string;
  expiryDate: Date | string;
  isActive: boolean;
  scope: CouponScope;
  applicableCategories?: string[];
  applicableBrands?: string[];
  applicableProducts?: string[];
  excludeSaleItems: boolean;
  firstOrderOnly: boolean;
  usageLimitPerUser: number;
  totalUsageLimit?: number;
  usageCount: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ICouponValidationResult {
  isValid: boolean;
  code: string;
  discountAmount: number;
  eligibleSubtotal: number;
  message: string;
}
