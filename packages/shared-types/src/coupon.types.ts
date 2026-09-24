export interface ICoupon {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minPurchase: number;
  expiryDate: Date;
  isActive: boolean;
  usageCount?: number;
}
