import { CouponRepository } from "./coupon.repository";
import { ICoupon } from "@store4riders/shared-types";
import { AppError, NotFoundError } from "../../core/errors/AppError";

/**
 * @class CouponService
 * @description Core business logic for discount coupons.
 * Highlights:
 * - Checks expiration, active status, and min purchase limits.
 * - Auto-caps discount amounts to never exceed the cart total.
 */
export class CouponService {
  
  static async validateCoupon(code: string, cartTotal: number): Promise<{ discountAmount: number }> {
    const coupon = await CouponRepository.findByCode(code);
    
    if (!coupon) throw new NotFoundError("Coupon");
    if (!coupon.isActive) throw new AppError("Coupon is not active", 400);
    if (new Date(coupon.expiryDate) < new Date()) throw new AppError("Coupon has expired", 400);
    if (cartTotal < coupon.minPurchase) throw new AppError(`Minimum purchase of ₹${coupon.minPurchase} required`, 400);

    let discountAmount = 0;
    if (coupon.discountType === "percent") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, cartTotal);
    return { discountAmount };
  }

  static async createCoupon(data: Partial<ICoupon>): Promise<ICoupon> {
    return await CouponRepository.create(data);
  }
}
