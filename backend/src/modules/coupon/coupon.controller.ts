import { NextRequest } from "next/server";
import { CouponService } from "./coupon.service";
import { CouponValidator } from "./coupon.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class CouponController
 * @description Minimal HTTP controller for Coupons.
 * Responsibilities:
 * 1. Extract payloads via CouponValidator.
 * 2. Delegate validation rules to CouponService.
 * 3. Return standardized API responses.
 */
export class CouponController {
  
  static async validate(req: NextRequest) {
    const { code, cartTotal } = await CouponValidator.validateApplyCoupon(req);
    const result = await CouponService.validateCoupon(code, cartTotal);
    return ApiResponse.success(result, "Coupon applied successfully");
  }

  static async create(req: NextRequest) {
    const data = await CouponValidator.validateCreate(req);
    const coupon = await CouponService.createCoupon(data as any);
    return ApiResponse.success(coupon, "Coupon created successfully", 201);
  }
}
